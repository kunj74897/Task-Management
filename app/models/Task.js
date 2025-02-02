import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'file'],
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  required: {
    type: Boolean,
    default: false
  },
  fileUrl: String // Only for file type fields
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description:{
    type:String,
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedRole: {
    type: String,
    enum: ['salesman', 'purchaseman']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  assignmentStatus: {
    type: String,
    enum: ['pending', 'accepted','rejected' ],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notificationFrequency: {
    type: {
      type: String,
      enum: ['once', 'recurring'],
      default: 'once'
    },
    interval: {
      type: String,
      enum: ['daily', 'custom'],
      default: 'daily'
    },
    customInterval: {
      hours: {
        type: Number,
        min: 0,
        max: 23,
        default: 24
      },
      minutes: {
        type: Number,
        min: 0,
        max: 59,
        default: 0
      }
    },
    startTime: Date,
    endTime: Date
  },
  lastNotified: Date,
  nextNotification: Date,
  repeatNotification: {
    type: Boolean,
    default: false
  },
  history: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  fields: [fieldSchema],
}, {
  timestamps: true
});

// Add middleware to calculate next notification time
taskSchema.pre('save', function(next) {
  if (this.isModified('notificationFrequency') || !this.nextNotification) {
    this.calculateNextNotification();
  }
  next();
});

taskSchema.methods.calculateNextNotification = function() {
  const now = new Date();
  
  if (this.notificationFrequency.type === 'once') {
    this.nextNotification = this.notificationFrequency.startTime;
    return;
  }

  if (this.notificationFrequency.interval === 'daily') {
    this.nextNotification = new Date(now.setHours(
      this.notificationFrequency.customInterval.hours,
      this.notificationFrequency.customInterval.minutes
    ));
    if (this.nextNotification < now) {
      this.nextNotification.setDate(this.nextNotification.getDate() + 1);
    }
  } else {
    // Custom interval
    const intervalMs = (this.notificationFrequency.customInterval.hours * 60 * 60 * 1000) +
                      (this.notificationFrequency.customInterval.minutes * 60 * 1000);
    this.nextNotification = new Date(now.getTime() + intervalMs);
  }
};

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task; 