'use strict'

var async = require('async')

module.exports = UserIs

var missingDefinitionError = 'E_MISSINGDEFINITION'
var notAuthorizedErrorCode = 'E_NOTAUTHORIZED'
var userNotFoundErrorCode = 'E_USERNOTFOUND'

function UserIs(roleFuncs, actionDefinitions, options) {
  roleFuncs = roleFuncs || {}
  actionDefinitions = actionDefinitions || {}

  options = options || {}
  options.errorOnMissingDefinitions = typeof(options.errorOnMissingDefinitions) !== 'undefined' ? options.errorOnMissingDefinitions : true

  function forUser(user) {

    function ableTo(action, cb) {
      var rolesThatCan = actionDefinitions[action]

      if (!rolesThatCan) {
        if (options.errorOnMissingDefinitions) {
          var error = new Error('You have not supplied a definition for action' + action)
          error.code = missingDefinitionError

          cb(error, false)
        } else {
          cb(null, false)
        }
      } else {
        async.detect(
          rolesThatCan
        , function(role, next) {
            a(role, function(err, isRole) {
              next(isRole)
            })
          }
        , function(result) {
            if (typeof(result) === 'undefined') {
              cb(null, false)
            } else {
              cb(null, true) 
            }
          }
        )
      }
    }

    // As in "userIs.a or user is a"
    // Justification for a one-letter function
    function a(role, cb) {
      var roleCheck = roleFuncs[role] 

      if (!roleCheck) {
        if (options.errorOnMissingDefinitions) {
          var error = new Error('You have not supplied a definition for role ' + role)
          error.code = missingDefinitionError

          cb(error, false)
        } else {
          cb(null, false)
        }
      } else {
        roleCheck(user, cb) 
      }
    }

    return {
      a: a
    , ableTo: ableTo
    }
  }

  function ensureAuthorizedTo(action) {
    return function(req, res, next) {
      options.retrieveUserFromRequest(req, function retrievedUser(err, user) {
        if (err) return next(err)
        if (!user) {
          var error = new Error('User not found')
          error.code = userNotFoundErrorCode

          return next(error)
        }

        forUser(user).ableTo(action, function(err, isAble) {
          if (err) return next(err)
          if (!isAble) {
            var error = new Error('Unauthorized')
            error.code = notAuthorizedErrorCode

            return next(error)
          }
          
          next()
        })
      })
    }
  }

  return {
    ensureAuthorizedTo: ensureAuthorizedTo
  , forUser: forUser
  }
}

UserIs.notAuthorizedErrorCode = notAuthorizedErrorCode
UserIs.userNotFoundErrorCode = userNotFoundErrorCode
