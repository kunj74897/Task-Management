import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedRole: {
    type: String,
    enum: ['salesman', 'purchaseman'],
    required: function() {
      return !this.assignedTo;
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notificationFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  repeatNotification: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  subTasks: [subTaskSchema]
}, {
  timestamps: true
});

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

export default Task; 