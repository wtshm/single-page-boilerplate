import Utils from './utils';
import $ from 'jquery';
import i18next from 'i18next';
import i18nextJquery from 'jquery-i18next';
import XHR from 'i18next-xhr-backend';

class Main {

    constructor() {
        Utils.retinize();
    }

    initLocales() {
        i18next.use(XHR).init({
            lngs: ['ja', 'en'],
            debug: true,
            backend: {
                loadPath: 'assets/locales/{{lng}}/{{ns}}.json'
            }
        }, () => {
            if (Utils.checkLanguage() === 'ja') {
                i18nextJquery.init(i18next, $);
                i18next.changeLanguage('ja', () => {
                    $('[data-i18n]').localize();
                });
            } else if (Utils.checkLanguage() === 'en') {
                i18nextJquery.init(i18next, $);
                i18next.changeLanguage('en', () => {
                    $('[data-i18n]').localize();
                });
            }
        });
    }

}

module.exports = new Main();
