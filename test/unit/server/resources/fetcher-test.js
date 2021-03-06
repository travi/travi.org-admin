import sinon from 'sinon';
import {assert} from 'chai';
import any from '@travi/any';
import {createFetcher} from '../../../../src/server/resources/fetcher';
import * as controller from '../../../../src/server/resources/controller';

const {getResource, getResources, getNav} = createFetcher();

suite('server-side data fetcher', () => {
  let sandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(controller, 'getResource');
    sandbox.stub(controller, 'getListOf');
    sandbox.stub(controller, 'listResourceTypes');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('that it gets a single resource', () => {
    const type = any.string();
    const id = any.integer();
    const promise = any.simpleObject();
    controller.getResource.withArgs(type, id).returns(promise);

    assert.equal(getResource(type, id), promise);
  });

  test('that it gets a list of resources', () => {
    const type = any.string();
    const promise = any.simpleObject();
    controller.getListOf.withArgs(type).returns(promise);

    assert.equal(getResources(type), promise);
  });

  test('that it gets the primary-nav', () => {
    const promise = any.simpleObject();
    controller.listResourceTypes.returns(promise);

    assert.equal(getNav(), promise);
  });
});
