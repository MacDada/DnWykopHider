'use strict';

$('ul.mainnav').append((function () {
    const isDisabled = localStorage['DnWH_disabled'];

    const $button = $('<a href="#"></a>')
        .text(isDisabled ? 'Włącz DnWykopHider' : 'Wyłącz DnWykopHider')
        .click(function (event) {
            event.preventDefault();

            if (isDisabled) {
                localStorage.removeItem('DnWH_disabled');
            } else {
                localStorage['DnWH_disabled'] = 'true';
            }

            window.location.reload();
        });

    if (!isDisabled) {
        runWykopHider({
            hiddenOpacity: 0.2,
            visibleFirst: true,
            gcDays: 30
        });
    }

    return $('<li></li>').append($button);
})());

function runWykopHider() {
}
