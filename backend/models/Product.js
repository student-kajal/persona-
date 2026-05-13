
// const mongoose = require('mongoose');

// const ProductSchema = new mongoose.Schema({
//   article: { type: String, required: true },
//   image: { type: String }, 
//   stockType: { type: String },
//   gender: { type: String },
//   mrp: { type: Number },
//   rate: { type: Number },
//   series: { type: String }, 
//   size: { type: String },
//   color: { type: String },

//   cartons: { type: Number, default: 0 },            
//   pairPerCarton: { type: Number, default: 0 },      
//   totalPairs: { type: Number, default: 0 },         

//   createdBy: { type: String },
//   noOfCrtn: { type: Number },
//   isDeleted: { type: Boolean, default: false }
// },
//  {
//   timestamps: true 
// });


// ProductSchema.pre('save', function (next) {
//   this.totalPairs = this.cartons * this.pairPerCarton;
//   next();
// });

// module.exports = mongoose.model('Product', ProductSchema);
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  article: { type: String, required: true },
  image: { type: String }, 
  stockType: { type: String },
  gender: { type: String },
  mrp: { type: Number },
  rate: { type: Number },
  series: { type: String }, 
  size: { type: String },
  color: { type: String },

  cartons: { type: Number, default: 0 },            
  pairPerCarton: { type: Number, default: 0 },      
  totalPairs: { type: Number, default: 0 },         
// Add this field to track total cartons already challaned out
  cartonsChallanedOut: { type: Number, default: 0 },
  
  createdBy: { type: String },
  noOfCrtn: { type: Number },
  isDeleted: { type: Boolean, default: false },

  // ✅ Correct location for history field
  history: [
    {
      action: String,
      updatedBy: String,
      updatedByName: String,
      changes: Object,
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true 
});

ProductSchema.pre('save', function (next) {
  this.totalPairs = this.cartons * this.pairPerCarton;
  next();
});

// ── Performance indexes (background: true = zero downtime on existing data) ──
// Compound index for the optimized endpoint's primary sort + filter pattern.
ProductSchema.index({ isDeleted: 1, cartons: -1, article: 1 }, { background: true });
// Support filter-options distinct queries.
ProductSchema.index({ isDeleted: 1, stockType: 1, gender: 1 },  { background: true });
ProductSchema.index({ isDeleted: 1, color: 1 },                  { background: true });
ProductSchema.index({ isDeleted: 1, size: 1 },                   { background: true });
ProductSchema.index({ isDeleted: 1, series: 1 },                 { background: true });
ProductSchema.index({ isDeleted: 1, mrp: 1 },                    { background: true });
ProductSchema.index({ isDeleted: 1, rate: 1 },                   { background: true });
ProductSchema.index({ isDeleted: 1, pairPerCarton: 1 },          { background: true });
// createdAt for history/time-range queries.
ProductSchema.index({ createdAt: -1 },                           { background: true });

module.exports = mongoose.model('Product', ProductSchema);
