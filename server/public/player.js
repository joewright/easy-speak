/* global SpeechSynthesisUtterance, console */
(function() {
    'use strict';
    var synth = window.speechSynthesis;

    var inputForm = document.getElementById('form');
    var inputTxt = document.getElementById('input');
    var voiceSelect = document.getElementById('select');
    var saveButton = document.getElementById('save');
    var allVoices = document.getElementById('all-voices');

    var voices = synth.getVoices();

    setupSynth();
    setupSave();
    checkUrlParams();

    function checkUrlParams() {
        // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript#2880929
        var urlParams;
        var match,
            pl = /\+/g, // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function(s) {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);

        urlParams = {};
        match = search.exec(query);
        while (match) {
            urlParams[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        if (urlParams.id) {
            loadMyThing(urlParams.id);
        }
    }

    function setupSynth() {
        for (var i = 0; i < voices.length; i++) {
            var option = document.createElement('option');
            option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
            option.setAttribute('data-lang', voices[i].lang);
            option.setAttribute('data-name', voices[i].name);
            voiceSelect.appendChild(option);

            var button = document.createElement('button');
            button.setAttribute('data-lang', voices[i].lang);
            button.setAttribute('data-name', voices[i].name);
            button.textContent = voices[i].name + ' (' + voices[i].lang + ')';
            allVoices.appendChild(button);
        }

        inputForm.onsubmit = function(event) {
            event.preventDefault();

            synth.cancel();
            var buttonVal = event.submitter.attributes['data-name'];
            if (buttonVal) {
                selectOption(buttonVal.value);
            }
            if (event.submitter.attributes['data-stop']) {
                return;
            }

            var utterThis = new SpeechSynthesisUtterance(inputTxt.value);
            utterThis.voice = getVoice();

            synth.speak(utterThis);
            inputTxt.blur();
        };
    }

    function setupSave() {
        var saving;
        saveButton.addEventListener('click', function saveClick() {
            if (saving || !inputTxt.value) {
                return false;
            }
            saving = true;
            var voice = getVoice();
            httpRequest({
                method: 'POST',
                url: '/save',
                body: {
                    content: inputTxt.value,
                    voice: voice && voice.voiceURI
                }
            }, function(err, result) {
                if (err) {
                    console.error(err);
                }
                saving = false;
                document.location.search = '?id=' + result.id;
            });
        });
    }

    function selectOption(name) {
        for (var x = 0; x < voiceSelect.childNodes.length; x++) {
            let option = voiceSelect.childNodes[x];
            option.selected = false;
            if (option && option.getAttribute('data-name') === name) {
                option.selected = 'selected';
            }
        }
    }

    function loadMyThing(id) {
        httpRequest({
            method: 'GET',
            url: '/phrases/' + id
        }, function(err, result) {
            if (err) {
                inputTxt.value = 'lol, we can\'t find your stuff';
                return console.error(err);
            }
            inputTxt.value = result.content;
            if (voices && voices.length) {
                var selectedName;
                for (var i = 0; i < voices.length; i++) {
                    if (voices[i].voiceURI === result.voice) {
                        selectedName = voices[i].name;
                    }
                }
                selectedName && selectOption(selectedName);
            }
        });
    }

    function getVoice() {
        var result;
        if (voiceSelect.selectedOptions[0]) {
            var name = voiceSelect.selectedOptions[0].getAttribute('data-name');
            for (var i = 0; i < voices.length; i++) {
                if (voices[i].name === name) {
                    result = voices[i];
                    break;
                }
            }
        }
        return result;
    }

    function httpRequest(options, callback) {

        var req = new XMLHttpRequest();
        req.addEventListener('load', function loaded() {
            var data;
            if (req.status !== 200) {
                return callback(req);
            }
            try {
                data = JSON.parse(req.responseText);
            } catch (e) {
                return callback(e);
            }
            callback(null, data);
        });
        req.open(options.method, options.url);
        req.setRequestHeader('Content-Type', 'application/json');
        if (options.body) {
            req.send(JSON.stringify(options.body));
        } else {
            req.send();
        }
    }
})();