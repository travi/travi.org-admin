import assets from '../../../../lib/server/view/static-assets';
import {assert} from 'chai';
import sinon from 'sinon';

suite('static assets', () => {
    test('that the plugin is defined', () => {
        assert.deepEqual(assets.register.attributes, {
            name: 'static-assets'
        });
    });

    test('that the static asset routes are configured', () => {
        const
            next = sinon.spy(),
            route = sinon.spy();

        assets.register({route}, null, next);

        assert.calledOnce(next);
        assert.calledWith(route, {
            method: 'GET',
            path: '/resources/{param*}',
            handler: {
                directory: {
                    path: 'resources'
                }
            }
        });
        assert.calledWith(route, {
            method: 'GET',
            path: '/favicon.ico',
            handler: {
                file: {
                    path: 'bower_components/travi.org-theme/img/favicon.ico'
                }
            }
        });
    });
});
