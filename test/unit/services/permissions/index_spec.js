var should = require('should'),
    sinon = require('sinon'),
    testUtils = require('../../../utils'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    models = require('../../../../core/server/models'),
    actionsMap = require('../../../../core/server/services/permissions/actions-map-cache'),
    permissions = require('../../../../core/server/services/permissions');

describe('Permissions', function () {
    var fakePermissions = [],
        findPostSpy,
        findTagSpy;

    before(function () {
        models.init();
    });

    beforeEach(function () {
        sinon.stub(models.Permission, 'findAll').callsFake(function () {
            return Promise.resolve(models.Permissions.forge(fakePermissions));
        });

        findPostSpy = sinon.stub(models.Post, 'findOne').callsFake(function () {
            return Promise.resolve(models.Post.forge(testUtils.DataGenerator.Content.posts[0]));
        });

        findTagSpy = sinon.stub(models.Tag, 'findOne').callsFake(function () {
            return Promise.resolve({});
        });
    });

    afterEach(function () {
        sinon.restore();
    });

    /**
     * Default test actionMap looks like this:
     * {
     *   browse: [ 'post' ],
     *   edit: [ 'post', 'tag', 'user', 'page' ],
     *   add: [ 'post', 'user', 'page' ],
     *   destroy: [ 'post', 'user' ]
     * }
     *
     * @param {object} options
     * @return {Array|*}
     */
    function loadFakePermissions(options) {
        options = options || {};

        var fixturePermissions = _.cloneDeep(testUtils.DataGenerator.Content.permissions),
            extraPerm = {
                name: 'test',
                action_type: 'edit',
                object_type: 'post'
            };

        if (options.extra) {
            fixturePermissions.push(extraPerm);
        }

        return _.map(fixturePermissions, function (testPerm) {
            return testUtils.DataGenerator.forKnex.createPermission(testPerm);
        });
    }

    describe('No init (no action map)', function () {
        it('throws an error without actionMap', function () {
            sinon.stub(actionsMap, 'empty').returns(true);

            permissions.canThis.should.throw(/No actions map found/);
        });
    });

    describe('Init (build actions map)', function () {
        it('can load an actions map from existing permissions', function (done) {
            fakePermissions = loadFakePermissions();

            permissions.init().then(function (actionsMap) {
                should.exist(actionsMap);

                permissions.canThis.should.not.throwError();

                _.keys(actionsMap).should.eql(['browse', 'edit', 'add', 'destroy']);

                actionsMap.browse.should.eql(['post']);
                actionsMap.edit.should.eql(['post', 'tag', 'user', 'page']);
                actionsMap.add.should.eql(['post', 'user', 'page']);
                actionsMap.destroy.should.eql(['post', 'user']);

                done();
            }).catch(done);
        });

        it('can load an actions map from existing permissions, and deduplicate', function (done) {
            fakePermissions = loadFakePermissions({extra: true});

            permissions.init().then(function (actionsMap) {
                should.exist(actionsMap);

                permissions.canThis.should.not.throwError();

                _.keys(actionsMap).should.eql(['browse', 'edit', 'add', 'destroy']);

                actionsMap.browse.should.eql(['post']);
                actionsMap.edit.should.eql(['post', 'tag', 'user', 'page']);
                actionsMap.add.should.eql(['post', 'user', 'page']);
                actionsMap.destroy.should.eql(['post', 'user']);

                done();
            }).catch(done);
        });
    });
});
