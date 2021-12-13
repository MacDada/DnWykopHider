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
    const injectStyleString = function (str) {
        const node = document.createElement('style');
        node.innerHTML = str;
        document.body.appendChild(node);
    };

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

            // redirectToNextPageIfAllHidablesAreHidden();
        },
        toggleVisibility: function ($hidable) {
            if ($hidable.hasClass(hiddenClass)) {
                hidablesController.show($hidable);
            } else {
                hidablesController.hide($hidable);
            }
        }
    };

    const HidablesStorage = function (storageDriver, prefix) {
        const countKey = "_" + prefix + "_count";

        this.has = function (id) {
            if (!id) {
                return false;
            }

            return storageDriver[prefix + id] ? true : false;
        };

        this.add = function (id) {
            if (!id) {
                return false;
            }

            if (!this.has(id)) {
                storageDriver[countKey]++;
            }

            storageDriver[prefix + id] = (new Date()).toJSON();

            return true;
        };

        this.remove = function (id) {
            if (!id) {
                return false;
            }

            if (this.has(id)) {
                storageDriver.removeItem(prefix + id);
                storageDriver[countKey]--;

                return true;
            }

            return false;
        };

        this.removeOlderThan = function (date) {
            console.log('dnwh removeOlderThan', date);

            const beforeCount = storageDriver[countKey];

            // deleting all storage hidables that are older then "date" arg.
            // takes only dnth keys into account (filters thx to the prefix)
            for (let key in storageDriver) {
                if (0 === key.indexOf(prefix)     // has the prefix
                    && new Date(storageDriver[key]) < date // is old enough
                ) {
                    console.log("dnwh removing ", key);

                    storageDriver.removeItem(key);
                    storageDriver[countKey]--;
                }
            }

            return beforeCount - storageDriver[countKey];
        };

        this.count = function () {
            return parseInt(storageDriver[countKey]);
        };

        this.clear = function () {
            return this.removeOlderThan(new Date());
        };

        // init count
        if (!storageDriver[countKey]) {
            storageDriver[countKey] = 0;
        }

        // gc: automatically delete old hidables
        (function (storage) {
            const date = new Date();
            date.setDate(date.getDate() - options.gcDays);

            console.log('dnwh gc: removed '
                + storage.removeOlderThan(date)
                + ' hidables older than '
                + date
            );
        })(this);
    }; // eo Storage

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
    const hiddenHidablesStorage = new HidablesStorage(localStorage, 'dnwh_hiddenHidable_');

    const $searchResult = $('#itemsStream');

    /**
     * Items to hide
     */
    const $hidables = $searchResult.find('li.link.iC:has(div.article.dC)');

    /**
     * Clicking on a table row (hidable), hides it.
     */
    $hidables.click(function () {
        hidablesController.toggleVisibility($(this));
    });

    /**
     * Page loaded: hiding elements already hidden and saved to localStorage
     */
    hidableView.hide($hidables.filter(function () {
        return hiddenHidablesStorage.has(identifyHidable($(this)));
    }), function () {});
}
