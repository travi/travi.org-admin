import prodConfigurator from '../../../../lib/shared/store/configure.prod';
import devConfigurator from '../../../../lib/shared/store/configure.dev';
import {assert} from 'chai';

suite('environment dependent store configurator loader', () => {
    teardown(() => {
        process.env.NODE_ENV = null;
        delete require.cache[require.resolve('../../../../lib/shared/store/configure')];
    });

    test('that dev configurator loads in non-production environment', () => {
        assert.equal(require('../../../../lib/shared/store/configure'), devConfigurator);
    });

    test('that production configurator loads in production environment', () => {
        process.env.NODE_ENV = 'production';

        assert.equal(require('../../../../lib/shared/store/configure'), prodConfigurator);
    });
});
