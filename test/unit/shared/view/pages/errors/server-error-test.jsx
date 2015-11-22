'use strict';

const
    React = require('react'),
    cheerio = require('cheerio'),
    reactDom = require('react-dom/server'),

    createNotFound = require('../../../../../../lib/shared/views/errors/server-error.jsx');

require('setup-referee-sinon/globals');

suite('not found', () => {
    const ServerError = createNotFound(React);

    test('that the proper content is displayed', () => {
        const $ = cheerio.load(reactDom.renderToStaticMarkup(<ServerError />));

        assert.equals($('h2').text(), '500');
        assert.equals($('p').text(), 'Server Error');
    });
});
