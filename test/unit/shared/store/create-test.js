import * as redux from 'redux';
import {fromJS} from 'immutable';
import any, {simpleObject} from '@travi/any';
import sinon from 'sinon';
import {assert} from 'chai';
import {configureStore} from '../../../../src/shared/store/create';
import * as reducers from '../../../../src/shared/store/reducers';
import * as middlewares from '../../../../src/shared/store/middlewares';

suite('store creation for production', () => {
  let sandbox;
  const initialState = simpleObject();
  const store = simpleObject();
  const composed = simpleObject();
  const combinedReducer = any.simpleObject();

  setup(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(reducers, 'getCombined').returns(combinedReducer);
    sandbox.stub(middlewares, 'getComposed').returns(composed);
    sandbox.stub(redux, 'createStore').withArgs(combinedReducer, fromJS(initialState), composed).returns(store);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('that redux store is created from provided initial state', () => {
    assert.equal(configureStore({initialState}), store);
  });

  test('that devtools browser extension is initialized if present', () => {
    redux.createStore.withArgs(combinedReducer, fromJS(initialState)).returns(store);

    configureStore(initialState);

    assert.equal(configureStore({initialState}), store);
  });
});
