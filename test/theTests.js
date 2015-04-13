var assert = require('assert')
var UserIs = require('../index.js')

function isAdmin(user, cb) {
  cb(null, user && user.isAdmin)
}

function isUser(user, cb) {
  cb(null, true)
}

describe('Having defined an admin role', function() {
  var accessDefs

  var roleFuncs = {
    'admin': isAdmin
  , 'user': isUser
  }

  var actionDefs = {
    'add new user': ['admin']
  , 'do something else': ['admin', 'user']
  }

  var options = {
    retrieveUserFromRequest: function(req, cb) {
      cb(null, req.user)
    }
  }

  accessDefs = UserIs(roleFuncs, actionDefs, options)

  describe('and a normal user', function() {
    var userIs = accessDefs.forUser({})

    it('should not say that I am an admin', function(done) {
      userIs.a('admin', function(err, isAdmin) {
        assert.ifError(err)
        assert(!isAdmin)

        done()
      })
    })

    it('should not say tht I can add users', function(done) {
      userIs.ableTo('add new user', function(err, isAble) {
        assert.ifError(err)
        assert(!isAble)

        done()
      })
    })

    it('should let the user do something else (handles multiple roles for same action)', function(done) {
      userIs.ableTo('do something else', function(err, isAble) {
        assert.ifError(err)
        assert(isAble)

        done()
      })
    })
  })

  describe('and an admin user', function() {
    var adminUser = {
      isAdmin: true
    }

    var userIs = accessDefs.forUser(adminUser)

    it('should let me define a role function', function(done) {
      userIs.a('admin', function(err, isAdmin) {
        assert.ifError(err)
        assert(isAdmin)
    
        done()
      })
    })

    it('should say that I am able to add new users', function(done) {
      userIs.ableTo('add new user', function(err, isAble) {
        assert.ifError(err)
        assert(isAble)

        done()
      })
    })
  })

  describe('and I ask it for middleware', function() {
    it('should let the admin do the thing', function(done) {
      var middleware = accessDefs.ensureAuthorizedTo('add new user')
      var req = { user: {isAdmin: true} }

      function next(err) {
        assert.ifError(err)

        done()
      }

      middleware(req, null, next)
    })

    it('should not let the normal user do the thing', function(done) {
      var middleware = accessDefs.ensureAuthorizedTo('add new user')
      var req = { user: {} }

      function next(err) {
        assert.equal(err.code, UserIs.notAuthorizedErrorCode)

        done()
      }

      middleware(req, null, next)
    })

    it('should give the correct error when there is no user in the request', function(done) {
      var middleware = accessDefs.ensureAuthorizedTo('add new user')

      function next(err) {
        assert.equal(err.code, UserIs.userNotFoundErrorCode)

        done()
      }

      middleware({}, null, next)
    })
  })
})

it('should introduce an error if I ask for an undefined role by default', function(done) {
  var userIs = UserIs({}, {}).forUser({})

  userIs.a('admin', function(err, isAdmin) {
    assert(err)

    done()
  })
})

it('should say false if I ask for an undefined role if I set it to not introduce an error', function(done) {
  var userIs = UserIs({}, {}, {errorOnMissingDefinitions: false}).forUser({})

  userIs.a('fool', function(err, isFool) {
    assert.ifError(err)
    assert(!isFool)

    done()
  })
})
