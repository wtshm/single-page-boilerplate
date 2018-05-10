import '../styles/main.sass';
import $ from 'jquery';
import Utils from './utils';
import I18next from 'i18next';
import I18nextJquery from 'jquery-i18next';
import XHR from 'i18next-xhr-backend';

class Main {

    constructor() {
        Utils.retinize();
    }

    initLocales() {
        I18next.use(XHR).init({
            lngs: ['ja', 'en'],
            debug: false,
            backend: {
                loadPath: 'assets/locales/{{lng}}/{{ns}}.json'
            }
        }, () => {
            if (Utils.checkLanguage() === 'ja') {
                I18nextJquery.init(I18next, $);
                I18next.changeLanguage('ja', () => {
                    $('[data-i18n]').localize();
                });
            } else if (Utils.checkLanguage() === 'en') {
                I18nextJquery.init(I18next, $);
                I18next.changeLanguage('en', () => {
                    $('[data-i18n]').localize();
                });
            }
        });
    }

}

module.exports = new Main();
