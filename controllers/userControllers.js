const tryCatch = require('../utils/tryCatchHandler');
const { User, Thought } = require("../models")
const { ObjectId } = require('mongoose').Types;

const userControllers = {
  getUsers: tryCatch(async (req, res) => {
    const users = await User.find().select('-__v')
    return res.json(users.map(user => user.toObject()))
  }),
  getUserById: tryCatch(async (req, res) => {
    const user = await User.findById(req.params.userId)
      .populate('thoughts')
      .populate({ path: 'friends', select: '_id username email friends' })
      .then(user => user.withMutuals())
      .catch(err => 'User not found')

    return res.json(user)
  }),
  createUser: tryCatch(async (req, res) => {
    const user = await User.create(req.body)
    return res.json(user.toObject())
  }),
  updateUserById: tryCatch(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.userId, req.body, {
      runValidators: true,
      new: true,
    }).select('-__v')
    user ? res.json(user.toObject()) : res.json('User not found')
  }),
  deleteUserById: tryCatch(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.userId)
    if (!user) return res.json('User not found')
    const thoughts = await Thought.deleteMany({
      _id: {
        $in: user.thoughts.map(thoughtId => ObjectId(thoughtId))
      }
    })
    return res.json({ user, thoughts })
  }),
  addFriend: tryCatch(async (req, res) => {
    const { userId, friendId } = req.params
    const user = await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: ObjectId(friendId) }
    }, {
      new: true
    })
    user ? res.json(user) : res.json('User not found')
  }),
  removeFriend: tryCatch(async (req, res) => {
    const { userId, friendId } = req.params
    const user = await User.findByIdAndUpdate(userId, {
      $pull: { friends: ObjectId(friendId) }
    }, {
      new: true
    })
    user ? res.json(user) : res.json('User not found')
  }),
}

module.exports = userControllers

