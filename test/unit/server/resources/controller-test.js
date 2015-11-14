'use strict';

const
    resourcesController = require('../../../../lib/server/resources/controller'),
    traviApiResources = require('../../../../lib/server/resources/travi-api-resources.js'),
    resourceMapperFactory = require('../../../../lib/server/resources/mappers/resource-mapper-factory'),

    any = require('../../../helpers/any-for-admin');

require('setup-referee-sinon/globals');

suite('resources controller', function () {
    setup(function () {
        sinon.stub(traviApiResources, 'getListOf');
        sinon.stub(traviApiResources, 'getResourceBy');
        sinon.stub(traviApiResources, 'getLinksFor');
        sinon.stub(resourceMapperFactory, 'getMapperFor');
    });

    teardown(function () {
        traviApiResources.getListOf.restore();
        traviApiResources.getResourceBy.restore();
        traviApiResources.getLinksFor.restore();
        resourceMapperFactory.getMapperFor.restore();
    });

    test('that an empty list of resource types is returned when none are available', function () {
        const callback = sinon.spy();

        traviApiResources.getLinksFor.withArgs('catalog').yields(null, {
            'self': {'href': 'https://api.travi.org/'}
        });

        resourcesController.listResourceTypes(callback);

        assert.calledWith(callback, null, []);
    });

    test('that link rels are listed when links are present', function () {
        const
            callback = sinon.spy(),
            linkName = any.string(),
            links = { 'self': {'href': any.url()}};
        links[linkName] = {'href': any.url()};
        traviApiResources.getLinksFor.withArgs('catalog').yields(null, links);

        resourcesController.listResourceTypes(callback);

        assert.calledWith(callback, null, [{
            text: linkName,
            path: `/${linkName}`
        }]);
    });

    test('that error bubbles for api request for recource-types', function () {
        const
            callback = sinon.spy(),
            error = any.simpleObject();
        traviApiResources.getLinksFor.withArgs('catalog').yields(error);

        resourcesController.listResourceTypes(callback);

        assert.calledWith(callback, error);
    });

    test('that resources are requested from the api by type', function () {
        const
            callback = sinon.spy(),
            resourceType = any.string(),
            resourceList = any.listOf(any.resource),
            mappedList = [
                'foo',
                'bar'
            ];
        traviApiResources.getListOf.withArgs(resourceType).yields(null, resourceList);
        resourceMapperFactory.getMapperFor.withArgs(resourceType).returns({
            mapToViewList: sinon.stub().withArgs(resourceList).returns(mappedList)
        });

        resourcesController.getListOf(resourceType, callback);

        assert.calledWith(callback, null, mappedList);
    });

    test('that error bubbles for api request for resources', function () {
        const
            callback = sinon.spy(),
            resourceType = any.string(),
            error = any.simpleObject();
        traviApiResources.getListOf.withArgs(resourceType).yields(error);

        resourcesController.getListOf(resourceType, callback);

        assert.calledWith(callback, error);
    });

    test('that resource is requested from the api', function () {
        const
            resourceType = any.string(),
            resourceId = any.string(),
            callback = sinon.spy(),
            resource = any.resource(),
            mappedResource = {foo: 'bar'};
        traviApiResources.getResourceBy.withArgs(resourceType, resourceId).yields(null, resource);
        resourceMapperFactory.getMapperFor.withArgs(resourceType).returns({
            mapToView: sinon.stub().withArgs(resource).returns(mappedResource)
        });

        resourcesController.getResource(resourceType, resourceId, callback);

        assert.calledWith(callback, null, mappedResource);
    });

    test('that error bubbles for api request for resource', function () {
        const
            resourceType = any.string(),
            resourceId = any.string(),
            callback = sinon.spy(),
            error = any.simpleObject();
        traviApiResources.getResourceBy.withArgs(resourceType, resourceId).yields(error);

        resourcesController.getResource(resourceType, resourceId, callback);

        assert.calledWith(callback, error);
    });
});
