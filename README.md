# node-user-is

Simple role-based outhorization library that makes no assumptions.

[![NPM version](https://badge.fury.io/js/user-is.svg)](http://badge.fury.io/js/user-is)

## Installation

```bash
$ npm install user-is
```

## Quickstart

```javascript
var UserIs = require('user-is')

// Define what it means to have your given roles.  Here we have a role called 'admin'.
var roleFuncs = {
  'admin': function isAdmin(user, cb) {
    cb(null, user && user.isAdmin)
  }
}

// Name the actions you care about, and state what roles are needed for them
var actionDefs = {
  'add new user': ['admin']
, 'do something else': ['admin', 'user']
}

// Get your authorization instance
var authorization = UserIs(roleFuncs, actionDefs)

// Find out if a given user has a certain role
var user = {} //... You've somehow retrieved this already
var userIs = authorization(user)

if (userIs.a('admin')) {
  // user is an 'admin', so do something with that
}

// Find out if a user can perform a certain action
if (userIs.ableTo('add new user')) {
  // user can do that action, so do something with that
}
```

## Do you use Express?

Or some other routing layer that uses `function(req, res, next)`-style functions for a middleware layer?  `user-is` has you covered.

```javascript
// How do you extract the user from a request?
function retrieveUserFromRequest(req, cb) {   // <---- async in case you need to go to the DB or something
  cb(null, req.user)
}

var options = {
  retrieveUserFromRequest: retrieveUserFromRequest
}

// resusing our definitions from above
var authorization = require('user-id')(roleFuncs, actionDefs, options)

// Now, wherever you have your routes
var router = require('express').Router

router.route('/add_new_user')
  .post(authorization.ensureAuthorizedTo('add new user'))
```

## What happens in the middleware if users aren't authorized

`user-is` will introduce an `Error` object into the queue.  The error will have a member `code` that depends on what the error is.

* Not authorized: 'E_NOTAUTHORIZED'
* User not found in the request: 'E_USERNOTFOUND'

There error codes are accessible directly off the `user-is` module, e.g.:

    UserIs.notAuthorizedErrorCode

So you'd want to also have an error-handling middleware for each possibility, e.g.:

```javascript
function notAuthorizedError(err, req, res, next) {
  if (err.code !== UserIs.notAuthorizedError) return next(err)

  res.status(403).send('You are not authorized to do that!')
}

router.route('/add_new_user')
  .post(authorization.ensureAuthorizedTo('add new user'), actualHandler, notAuthorizedError)
```

## Other options

The modules returns a function with the following signature:

```javascript
function UserIs(roleFuncs, actionDefinitions, options)
```

You've aleady seen the option for how to transform a request into a user object.  There is another option though.

If you ask a question about a role or action that you haven't defined, by default, `user-is` will introduce an error with code `'E_MISSINGDEFINITION'`.  This error is also accessible directly off the module:

    UserIs.missingDefinitionErrorCode

If you'd rather it just return false in your checks, use the following option:

```javascript
  var options = {
    errorOnMissingDefinitions: true
  }

  var authorization = UserIs(roleFuncs, actionDefs, options)

  var userIs = authorization.forUser(/*some user object*/)

  userIs.a('role I have not mentioned before', function(err, isRole) {
    // isRole is now false
  })
```

## Tests

`make test`

## Want to contribute?

Fork this repo, make your change, and submit a pull request.  It's worth checking the issues first to see if someone else has reported the issue.  If you're unsure if a given feature is desired, open up an issue on it, and let's discuss!

## Acknowledgements

A big thanks to the fine folks who wrote [`authorized`](https://www.npmjs.com/package/authorized).  Your library heavily inspried this one.

## License

[MIT](LICENSE)
