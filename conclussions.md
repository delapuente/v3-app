# Problems found during Custom Store implementation

  * Simply adding a new cache before de offline cache crashes the application.

  * This was caused becuase RawCache was not following the
  work-only-if-no-response pattern. This pattern is quite usual that we shuold
  consider to add it to sww. We can opt between explicitely invoke next
  middleware or explicitely say we want to send the response now.

  * Explicitely saying send() sounds more reasonable as the developer could
  always add a "andSend()" middleware to terminate the previous middleware.

  ```js
  function andSend(req, res, sendNow) {
    sendNow();
  }
  ```

  * After starting A/B testing, the post on movie is swallowed by the render
  cache.

  * A little modification on the RawCache for the render cache helps to
  distinguish between adding to the RenderCache and adding to the CustomCache.
  Quite tricky.

  * Moreover, as the route for CustomCache is '/' and this matches everything,
  trying to GET, POST or DELETE beyond '/api/' will fail as RawCache will
  intercept and use the method as a command for itself. '/api/' won't fail
  as the middlewares to handle it are placed before the Custom Store.

  * RawCache should provide an API separated from sending requests to the
  Internet or, at least, provide a control URL (open a bug) separated from its
  route to fix the former issues.

  * The current policy for the offline cache is to fetchAndCache, this implies
  the modifications are also cached. We need a way to evict those entries from
  the offline cache before fetching the new resources or allow higher
  customization of the offline cache to allow other policies or prevent
  some URLs from being cached.

  * Moreover, this policy is caching searchs as well. Searchs are an example
  of the need of a policy favouring network over offline cache.

  * The A/B testing modifications alter the template for movie. Although the
  Custom Store holds the modified template for movie.html, the links to this
  page are in the form of movie.html?id=xxxxx. Current RawCache used to
  implement the Custom Store does not support matching options to ignore the
  query part.

  * I have a custom branch (open bug) to implement a sort of polyfill.

## Conclussions

  * The critical part for Custom Store is the client side who manages the
  update and restoration of the Custom Store.

  * The Custom Store need to collaborate with the rest of stores (i.e. to
  remove the offline copies of the resources to be customized or invalidate
  the render cache.)

  * Although I did not try another use case rather than Custom Store for A/B
  testing, I foresee that to allow several Custom Stores we will need some
  kind of hierarchy manager to specify the order for Custom Store to match
  the answer.
