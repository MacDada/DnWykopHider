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
            gcDays: 10
        });
    }

    return $('<li></li>').append($button);
})());

function runWykopHider(options) {
    const hiddenClass = 'DnWH_hidden';

    injectStyleString('.' + hiddenClass + ' { opacity: ' + options.hiddenOpacity + '; }');

    /**
     * Show/hide hidables in the view
     */
    const hidableView = {
        hide: function ($hidables, onComplete) {
            $hidables.addClass(hiddenClass);

            if (onComplete) {
                onComplete();
            }
        },
        show: function ($hidables, onComplete) {
            $hidables.removeClass(hiddenClass);

            if (onComplete) {
                onComplete();
            }
        },
        sortByVisibility: function () {
            $hidables.sortElements(function (hidable) {
                return $(hidable).hasClass(hiddenClass) ? 1 : -1;
            });
        }
    };

    const hidablesController = {
        showAll: function () {
            hidablesController.show($hidables);
        },
        hideAll: function () {
            hidablesController.hide($hidables);

            if (0 === options.hiddenOpacity) {
                window.scrollTo(0, 0);
            }
        },
        show: function ($hidables) {
            $hidables.each(function () {
                hiddenHidablesStorage.remove(identifyHidable($(this)));
            });

            hidableView.show($hidables);
        },
        hide: function ($hidables) {
            $hidables.each(function () {
                hiddenHidablesStorage.add(identifyHidable($(this)));
            });

            hidableView.hide($hidables);

            redirectToNextPageIfAllHidablesAreHidden();
        },
        toggleVisibility: function ($hidable) {
            if ($hidable.hasClass(hiddenClass)) {
                hidablesController.show($hidable);
            } else {
                hidablesController.hide($hidable);
            }
        }
    };

    /**
     * Gets hidable identifying data
     */
    const identifyHidable = function ($hidable) {
        try {
            const id = $hidable.find('div.article.dC').attr('data-id');

            if (isNaN(id)) {
                throw 'ID should be a number'
            }

            return parseInt(id);
        } catch (e) {
            console.error('identifyHidable() identification error', $hidable, id);

            throw e;
        }
    };

    /**
     * Hidables IDs storage helper.
     * Keys have prefix to avoid collisions and easly find "out" items.
     * Key hold hidable IDs, values have the date they were hidden.
     */
    const hiddenHidablesStorage = new HidablesStorage(localStorage, 'dnwh_hiddenHidable_', options.gcDays);

    const $searchResult = $('#itemsStream');

    /**
     * Items to hide
     */
    const $hidables = $searchResult.find('li.link.iC:has(div.article.dC)');

    const $nextPageButtons = $('.pager a.button:last-child');

    /**
     * Clicking on a table row (hidable), hides it.
     */
    $hidables.click(function () {
        hidablesController.toggleVisibility($(this));
    });

    /**
     * Show all / hide all buttons after paginator
     */
    $('<a href="#" class="dnwhBottomButton">' + chrome.i18n.getMessage('showAll') + '</a>')
        .click(function (e) {
            e.preventDefault();

            hidablesController.showAll();
        })
        .insertAfter($nextPageButtons);

    $('<a href="#" class="dnwhBottomButton dnthHideAll">' + chrome.i18n.getMessage('hideAll') + '</a>')
        .click(function (e) {
            e.preventDefault();

            hidablesController.hideAll();
        })
        .insertAfter($nextPageButtons);

    function redirectToNextPageIfAllHidablesAreHidden() {
        const hidablesCount = $hidables.length;
        const visibleHidablesCount = $hidables.not('.' + hiddenClass).length;

        console.log('redirect?', hidablesCount, visibleHidablesCount);

        if (0 !== hidablesCount && 0 === visibleHidablesCount) {
            console.log('no visible items, redirecting to next page');

            $nextPageButtons[0].click();
        }
    }

    /**
     * Page loaded: hiding elements already hidden and saved to localStorage
     */
    hidableView.hide($hidables.filter(function () {
        return hiddenHidablesStorage.has(identifyHidable($(this)));
    }), redirectToNextPageIfAllHidablesAreHidden);
}
