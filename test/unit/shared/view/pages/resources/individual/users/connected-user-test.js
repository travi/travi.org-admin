import React from 'react';
import * as reactRedux from 'react-redux';
import Immutable from 'immutable';
import * as components from '@travi/admin.travi.org-components';
import connectedUser from '../../../../../../../../lib/shared/views/resources/individual/users/connected-user';

import sinon from 'sinon';
import {assert} from 'chai';
import {string, url, simpleObject} from '@travi/any';

suite('connected user component', () => {
    let sandbox;
    const User = simpleObject();

    setup(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(reactRedux, 'connect');
        sandbox.stub(components, 'createUser').withArgs(React).returns(User);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('that the Resource component is connected to the redux store', () => {
        const connectToComponent = sinon.stub();
        reactRedux.connect.returns(connectToComponent);

        connectedUser(React);

        assert.calledWith(connectToComponent, User);
    });

    test('that redux state is mapped to props', () => {
        reactRedux.connect.returns(sinon.stub());
        connectedUser(React);
        const
            resource = {
                id: string(),
                displayName: string(),
                name: {
                    first: string(),
                    last: string()
                },
                links: simpleObject(),
                thumbnail: url()
            },
            mapStateToProps = reactRedux.connect.getCall(0).args[0],

            {user} = mapStateToProps(Immutable.fromJS({resource}));

        assert.equal(user.id, resource.id);
        assert.equal(user.displayName, resource.displayName);
        assert.deepEqual(user.name, resource.name);
        assert.deepEqual(user.links, resource.links);
        assert.equal(user.avatar, resource.thumbnail);
    });
});
