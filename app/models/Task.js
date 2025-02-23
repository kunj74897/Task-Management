import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['string', 'number', 'file', 'date'],
    required: true,
  },
  value: mongoose.Schema.Types.Mixed,
  required: {
    type: Boolean,
    default: false,
  },
  fileUrl: String
});

// Add a pre-save middleware to validate date fields
fieldSchema.pre('save', function(next) {
  if (this.type === 'date' && this.value) {
    const date = new Date(this.value);
    if (isNaN(date.getTime())) {
      next(new Error(`Invalid date for field ${this.label}`));
    }
  }
  next();
});

// Add validation for phone numbers
fieldSchema.pre('save', function(next) {
  if (this.type === 'number' && this.value) {
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(this.value)) {
      next(new Error(`Invalid phone number format for field ${this.label}`));
    }
  }
  next();
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    assignedRole: {
      type: String,
      enum: ['salesman', 'purchaseman'],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    assignmentStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    notificationFrequency: {
      type: {
        type: String,
        enum: ['once', 'recurring'],
        default: 'once',
      },
      interval: {
        type: String,
        enum: ['daily', 'custom'],
        default: 'daily',
      },
      customInterval: {
        hours: {
          type: Number,
          min: 0,
          max: 23,
          default: 24,
        },
        minutes: {
          type: Number,
          min: 0,
          max: 59,
          default: 0,
        },
      },
      startTime: {
        type: Date,
        default: Date.now,
      },
      endTime: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      },
    },
    lastNotified: Date,
    nextNotification: Date,
    repeatNotification: {
      type: Boolean,
      default: false,
    },
    history: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    fields: [fieldSchema],
  },
  {
    timestamps: true,
  }
);

// Add middleware to calculate next notification time
taskSchema.pre('save', function (next) {
  try {
    if (this.isModified('notificationFrequency') || !this.nextNotification) {
      this.calculateNextNotification();
    }
    next();
  } catch (error) {
    next(error);
  }
});

taskSchema.methods.calculateNextNotification = function () {
  const now = new Date();

  if (this.notificationFrequency.type === 'once') {
    this.nextNotification = this.notificationFrequency.startTime;
    return;
  }

  if (this.notificationFrequency.interval === 'daily') {
    const nextNotify = new Date(now);
    nextNotify.setHours(
      this.notificationFrequency.customInterval.hours,
      this.notificationFrequency.customInterval.minutes,
      0,
      0
    );
    if (nextNotify <= now) {
      nextNotify.setDate(nextNotify.getDate() + 1);
    }
    this.nextNotification = nextNotify;
  } else {
    // Custom interval
    const intervalMs =
      this.notificationFrequency.customInterval.hours * 60 * 60 * 1000 +
      this.notificationFrequency.customInterval.minutes * 60 * 1000;
    this.nextNotification = new Date(now.getTime() + intervalMs);
  }
};

// Indexes for performance optimization
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedTo: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;