'use strict';

const
    proxyquire = require('proxyquire'),
    routeRenderer = require('../../../../lib/server/view/route-renderer.jsx'),
    resourcesController = require('../../../../lib/server/resources/controller'),
    reducer = require('../../../../lib/shared/store/reducer'),
    redux = require('redux'),
    immutable = require('immutable'),
    history = require('history'),
    _ = require('lodash'),
    any = require('../../../helpers/any');

suite('rendering handler', () => {
    const
        Negotiator = sinon.stub(),
        handler = proxyquire('../../../../lib/server/view/rendering-handler', {
            'negotiator': Negotiator
        }),
        primaryNav = any.listOf(
            () => {
                return {
                    text: any.string()
                };
            },
            {min: 5}
        );

    let sandbox,
        mediaType,
        request;

    setup(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(redux, 'createStore');
        sandbox.stub(routeRenderer, 'routeTo');
        sandbox.stub(history, 'createLocation');
        sandbox.stub(resourcesController, 'listResourceTypes').yields(null, primaryNav);

        request = any.simpleObject();
        request.url = any.url();
        mediaType = sinon.stub();
        Negotiator.withArgs(request).returns({mediaType});
    });

    teardown(() => {
        sandbox.restore();
        Negotiator.reset();
    });

    test('that the plugin is defined', () => {
        assert.equals(handler.register.attributes, {
            name: 'rendering-handler'
        });
    });

    test('that a non-html request is forwarded with no modification', () => {
        const
            next = sinon.spy(),
            reply = { continue: sinon.spy() },
            extension = sinon.stub().withArgs('onPreResponse').yields(request, reply);
        mediaType.returns('text/foo');

        handler.register({ext: extension}, null, next);

        assert.calledOnce(next);
        assert.calledOnce(reply.continue);
        refute.called(redux.createStore);
    });

    test('that an html request returns a rendered view', () => {
        request.params = {resourceType: primaryNav[2].text};
        request.response = {source: any.simpleObject()};
        const
            reply = { view: sinon.spy() },
            extension = sinon.stub().withArgs('onPreResponse').yields(request, reply),
            renderedContent = any.string(),
            reduxState = any.simpleObject(),
            store = {
                getState: sinon.stub().returns(reduxState),
                dispatch: sinon.spy()
            },
            primaryNavWithActiveLink = _.map(primaryNav, (item, index) => {
                return _.extend({}, item, {active: 2 === index});
            }),
            data = _.extend({}, request.response.source, {
                primaryNav: primaryNavWithActiveLink
            });
        mediaType.returns('text/html');
        redux.createStore.withArgs(reducer, immutable.fromJS(request.response.source)).returns(store);

        handler.register({ext: extension}, null, sinon.spy());

        refute.called(reply.view);

        assert.calledWith(routeRenderer.routeTo, request.url, data, store);
        routeRenderer.routeTo.yield(null, renderedContent);

        assert.calledWith(store.dispatch, {
            type: 'SET_PRIMARY_NAV',
            nav: primaryNavWithActiveLink
        });
        assert.calledWith(reply.view, 'layout/layout', {
            renderedContent,
            initialData: JSON.stringify([
                {primaryNav: primaryNavWithActiveLink},
                data
            ]),
            initialState: JSON.stringify(reduxState)
        });
    });

    test('that error bubbles', () => {
        request.response = {};
        const
            reply = sinon.spy(),
            error = any.simpleObject(),
            extension = sinon.stub().withArgs('onPreResponse').yields(request, reply);
        mediaType.returns('text/html');
        resourcesController.listResourceTypes.yields(error);

        handler.register({ext: extension}, null, sinon.spy());

        assert.calledWith(reply, error);
    });

    test('that data defaults to empty object since error case does not set response.source', () => {
        request.params = {};
        request.response = {};
        const
            reply = { view: sinon.spy() },
            extension = sinon.stub().withArgs('onPreResponse').yields(request, reply),
            location = any.simpleObject(),
            renderedContent = any.string(),
            data = _.extend({}, request.response.source, {
                primaryNav: _.map(primaryNav, (item) => {
                    return _.extend({}, item, {active: false});
                })
            }),
            reduxState = any.simpleObject();
        redux.createStore.returns({
            getState: sinon.stub().returns(reduxState),
            dispatch: sinon.spy()
        });
        mediaType.returns('text/html');
        history.createLocation.withArgs(request.url).returns(location);
        routeRenderer.routeTo.yields(null, renderedContent);

        handler.register({ext: extension}, null, sinon.spy());

        assert.calledWith(reply.view, 'layout/layout', {
            renderedContent,
            initialData: JSON.stringify([data]),
            initialState: JSON.stringify(reduxState)
        });
    });
});
