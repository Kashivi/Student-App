
async function translateText() {
    const text = document.getElementById('input-text').value.trim();
    if (!text) return;

    const fromLang = document.getElementById('from-language').value;
    const toLang = document.getElementById('to-language').value;

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                fromLang: fromLang,
                toLang: toLang
            })
        });

        const data = await response.json();
        
        if (data.translation) {
            document.getElementById('output-text').value = data.translation;
            document.getElementById('pronunciation').innerText = 'Pronunciation: ' + (data.pronunciation || 'N/A');
        } else {
            document.getElementById('output-text').value = 'Translation failed. Please try again.';
        }
        
    } catch (err) {
        console.error(err);
        document.getElementById('output-text').value = 'Error translating text. Please try again.';
    }
}

function switchLanguages() {
    const fromLang = document.getElementById('from-language');
    const toLang = document.getElementById('to-language');
    [fromLang.value, toLang.value] = [toLang.value, fromLang.value];
}

function speak(text, lang = 'auto') {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
}

document.getElementById('translate-button').addEventListener('click', translateText);
document.getElementById('switch-languages').addEventListener('click', switchLanguages);

document.getElementById('input-speak').addEventListener('click', () => {
    const text = document.getElementById('input-text').value;
    if (text) speak(text);
});

document.getElementById('output-speak').addEventListener('click', () => {
    const text = document.getElementById('output-text').value;
    if (text) speak(text);
});


document.getElementById('pronunciation-speak').addEventListener('click', () => {
    const pronunciationText = document.getElementById('pronunciation').innerText.replace('Pronunciation: ', '');
    if (pronunciationText) speak(pronunciationText, 'en-US');
});


document.getElementById('copy-button').addEventListener('click', () => {
    const text = document.getElementById('output-text').value;
    if (text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
    }
});
 