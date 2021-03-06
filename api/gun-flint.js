const Flint = require("gun-flint");
const Mongojs = require("mongojs");

const GunMongo = new Flint.NodeAdapter({
  /**
   * @type {boolean}  Whether or not the adapter has been properly initialized and can attempt DB connections
   */
  initialized: false,

  /**
   * Handle Initialization options passed during Gun initialization of <code>opt</code> calls.
   *
   * Prepare the adapter to create a connection to the Mongo server
   *
   * @param {object}  context    The full Gun context during initialization/opt call
   * @param {object}  opt        Options pulled from fully context
   *
   * @return {void}
   */
  opt: function (context, opt) {
    let mongo = opt.mongo || null;
    if (mongo) {
      this.initialized = true;

      this.collection = mongo.collection || "gun-mongo";
      this.indexInBackground = mongo.indexInBackground || false;
      this.db = Mongojs(mongo.uri);
    } else {
      this.initialized = false;
    }
  },

  /**
   * Retrieve results from the DB
   *
   * @param {string}   key    The key for the node to retrieve
   * @param {function} done   Call after retrieval (or error)
   *
   * @return {void}
   */
  get: function (key, done) {
    if (this.initialized) {
      this.getCollection().findOne({ _id: key }, {}, (err, result) => {
        if (err) {
          done(this.errors.internal);
        } else if (!result) {
          done(null);
        } else {
          done(null, result.val);
        }
      });
    }
  },

  /**
   * Write nodes to the DB
   *
   * @param {string}   key   The key for the node
   * @param {object}   node  The full node with metadata
   * @param {function} done  Called when the node has been written
   *
   * @return {void}
   */
  put: function (key, node, done) {
    if (this.initialized) {
      console.log("writing!!");
      console.log(
        "yeaaah",
        this.getCollection(key).findAndModify(
          {
            query: { _id: key },
            update: {
              key: key,
              val: node,
            },
            upsert: true,
          },
          done
        )
      );
    }
  },

  /**
   * Retrieve the collection for querying
   *
   * @return {object}   A collection to query
   */
  getCollection: function () {
    return this.db.collection(this.collection);
  },

  /**
   * Ensure indexes are created on the proper fields
   *
   * @return {void}
   */
  _ensureIndex() {
    this._getCollection().createIndex(
      {
        _id: 1,
      },
      {
        background: this.indexInBackground,
      }
    );
  },
});

module.exports = Flint.register(GunMongo);
