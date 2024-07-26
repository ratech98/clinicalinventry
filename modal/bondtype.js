const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bondSchema = new Schema({
  name: {
    type: String,
    required: true,
   
  },
 

},{timestamps:true}
);

const bondtype = mongoose.model('bondtype', bondSchema);

module.exports = bondtype;
