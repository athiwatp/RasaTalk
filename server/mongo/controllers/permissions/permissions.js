const permissionSchema = require('../../schemas/permissionsSchema');
const usersSchema = require('../../../authentication/models/user');
const debug = require('debug')('Permissions.js Controller');

function getPermissions(req, res) {
  permissionSchema
    .find({})
    .lean()
    .exec()
    .then(permissions => {
      usersSchema
        .find({}, 'role groups permissions role name')
        .lean()
        .exec()
        .then(users => {
          const send = {
            roles: permissions.filter(perm => perm.type === 'role'),
            groups: permissions.filter(perm => perm.type === 'group'),
            permissions: permissions.find(perm => perm.type === 'permissions')
              .permissions,
            users,
          };

          // const groups = permissions.filter((perm) => perm.type === 'group');
          res.send(send);
          return null;
        });
    })
    .catch(() => res.statusCode(400).send('Failed getting permissions'));
}

function updateRoles(req, res) {
  const { id, permissions } = req.body;
  permissionSchema
    .update({ type: 'role', name: id }, { $set: { permissions } })
    .then(() => {
      res.status(275).send('Role updated');
    })
    .catch(err => {
      debug(err);
      res.status(475).send('Role failed to update');
    });
}

function updateGroups(req, res) {
  const { id, permissions } = req.body;
  permissionSchema
    .update({ type: 'group', name: id }, { $set: { permissions } })
    .then(() => {
      res.status(275).send('Group updated');
    })
    .catch(err => {
      debug(err);
      res.status(475).send('Group failed to update');
    });
}

function updateUser(req, res) {
  const { id, setting, permissions } = req.body;

  usersSchema
    .update({ _id: id }, { $set: { [setting]: permissions } })
    .then(() => {
      res.status(275).send('User updated');
      return null;
    })
    .catch(error => {
      debug(error);
      res.status(475).send('User failed to update');
    });
}

/**
 * Run once on start up to make sure we have the DB setup.
 */
permissionSchema.find({}).then(model => {
  if (model.length === 0) {
    // eslint-disable-next-line global-require
    const def = require('./defaultData');
    permissionSchema.create(def);
  }
});

module.exports = {
  getPermissions,
  updateRoles,
  updateGroups,
  updateUser,
};
