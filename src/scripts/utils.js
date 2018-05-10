import $ from 'jquery';

class Utils {

    static retinize() {
        let retinaCheck = window.devicePixelRatio;
        if (retinaCheck >= 2) {
            $('img.retina').each(function() {
                let retinaImage = $(this).attr('src').replace(/\.(?=(?:png|jpg|jpeg)$)/i, '@2x.');
                $(this).attr('srcset', retinaImage + ' 2x');
            });
        }
    }

    static checkLanguage() {
        let ua = window.navigator.userAgent.toLowerCase();
        try {
            // chrome
            if (ua.indexOf('chrome') !== -1) {
                return (navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
            }
            return (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
        } catch (e) {
            return undefined;
        }
    }

}
