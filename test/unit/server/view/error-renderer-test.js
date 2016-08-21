import React from 'react';
import ReactDOMServer from 'react-dom/server';
import sinon from 'sinon';
import {assert} from 'chai';
import proxyquire from 'proxyquire';
import any from '@travi/any';
import * as storeCreator from '../../../../lib/shared/store/create';
import ErrorPage from '../../../../lib/shared/views/errors/page';
import Root from '../../../../lib/shared/views/root/root';
import * as htmlRenderer from '../../../../lib/server/view/html-renderer';
import * as primaryNavActions from '../../../../lib/shared/views/theme/wrap/duck';

suite('error renderer', () => {
    const
        Negotiator = sinon.stub(),
        errorRenderer = proxyquire('../../../../lib/server/view/error-renderer', {
            'negotiator': Negotiator
        });

    suite('plugin', () => {
        test('that the plugin is defined', () => {
            assert.deepEqual(errorRenderer.register.attributes, {
                name: 'error-renderer'
            });
        });

        test('that the 500 error page when the status is 500', () => {
            const
                next = sinon.spy(),
                ext = sinon.spy();

            errorRenderer.register({ext}, null, next);

            assert.calledWith(ext, 'onPreResponse', errorRenderer.handler);
            assert.calledOnce(next);
        });
    });

    suite('handler', () => {
        let sandbox, request, erroringRequest, mediaType;
        const
            store = any.simpleObject(),
            state = any.simpleObject(),
            statusCode = 500;

        setup(() => {
            sandbox = sinon.sandbox.create();
            sandbox.stub(storeCreator, 'configureStore').returns(store);
            sandbox.stub(ReactDOMServer, 'renderToString');
            sandbox.stub(React, 'createElement');
            sandbox.stub(htmlRenderer, 'respond');
            sandbox.stub(primaryNavActions, 'loadNav');

            store.dispatch = sinon.stub();
            store.getState = sinon.stub().returns(state);
            mediaType = sinon.stub();
            request = {...any.simpleObject(), url: {path: any.url()}, setUrl: sinon.spy(), response: {}};
            erroringRequest = {...request, response: {isBoom: true, output: {statusCode}}};
            Negotiator.withArgs(erroringRequest).returns({mediaType});
        });

        teardown(() => {
            sandbox.restore();
            Negotiator.reset();
        });


        test('that a normal response is not modified', () => {
            const replyContinue = sinon.spy();
            mediaType.returns('text/html');

            errorRenderer.handler(request, {continue: replyContinue});

            assert.calledOnce(replyContinue);
        });

        test('that a boom response for a non-html request is not modified', () => {
            const replyContinue = sinon.spy();
            mediaType.returns('text/foo');

            errorRenderer.handler(erroringRequest, {continue: replyContinue});

            assert.calledOnce(replyContinue);
        });

        test('that a boom response for an html request is rendered to html', () => {
            const
                errorPageComponent = any.simpleObject(),
                rootComponent = any.simpleObject(),
                renderedContent = any.string(),
                reply = any.simpleObject(),
                loadNavPromise = any.simpleObject();
            mediaType.returns('text/html');
            React.createElement.withArgs(ErrorPage).returns(errorPageComponent);
            React.createElement.withArgs(Root, {store}, errorPageComponent).returns(rootComponent);
            ReactDOMServer.renderToString.withArgs(rootComponent).returns(renderedContent);
            primaryNavActions.loadNav.withArgs(state).returns(loadNavPromise);
            store.dispatch.withArgs(loadNavPromise).resolves();

            return errorRenderer.handler(erroringRequest, reply).then(() => {
                assert.calledWith(htmlRenderer.respond, reply, {renderedContent, store, boomDetails: {statusCode}});
            });
        });

        test('that a failure to fetch the primary nav still renders the error as html', () => {
            const
                errorPageComponent = any.simpleObject(),
                rootComponent = any.simpleObject(),
                renderedContent = any.string(),
                reply = any.simpleObject(),
                error = any.word();
            mediaType.returns('text/html');
            React.createElement.withArgs(ErrorPage).returns(errorPageComponent);
            React.createElement.withArgs(Root, {store}, errorPageComponent).returns(rootComponent);
            ReactDOMServer.renderToString.withArgs(rootComponent).returns(renderedContent);
            store.dispatch = sinon.stub().rejects(error);

            return Promise.all([
                assert.isRejected(errorRenderer.handler(erroringRequest, reply), new RegExp(error)),
                errorRenderer.handler(erroringRequest, reply).catch(() => {
                    assert.calledWith(
                        htmlRenderer.respond,
                        reply,
                        {renderedContent, store, boomDetails: {statusCode: 500}}
                    );
                })
            ]);
        });
    });
});
