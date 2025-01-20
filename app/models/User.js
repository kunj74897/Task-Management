import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  mobileNo: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v); // Validates 10-digit mobile numbers
      },
      message: props => `${props.value} is not a valid mobile number!`
    }
  },
  role: {
    type: String,
    enum: ['salesman', 'purchaseman'],
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  assignedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  taskStats: {
    pending: { type: Number, default: 0 },
    inProgress: { type: Number, default: 0 },
    completed: { type: Number, default: 0 }
  },
  recentActivity: [{
    action: {
      type: String,
      enum: ['task_assigned', 'task_completed', 'task_updated']
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

userSchema.methods.updateTaskStats = async function() {
  const taskCounts = await mongoose.model('Task').aggregate([
    {
      $match: {
        assignedTo: this._id
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  this.taskStats = {
    pending: 0,
    inProgress: 0,
    completed: 0
  };

  taskCounts.forEach(({ _id, count }) => {
    if (_id === 'pending') this.taskStats.pending = count;
    if (_id === 'in-progress') this.taskStats.inProgress = count;
    if (_id === 'completed') this.taskStats.completed = count;
  });

  await this.save();
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 