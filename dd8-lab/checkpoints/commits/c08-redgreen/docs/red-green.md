# Was the test red first? REQ-003

I took the perishable fix away and ran the REQ-003 tests, then put it back and ran them again.

```text
$ git stash                          # the fix was uncommitted, so this puts it away
$ npm test -- --grep REQ-003         # without the fix
  ✖ REQ-003: produce, dairy, meat, frozen and bakery items are not eligible
  ✖ REQ-003: a frozen item is not eligible, even though its shelf life is 180 days
  ℹ fail 2
$ git stash pop                      # the fix is back
$ npm test -- --grep REQ-003         # with the fix
  ℹ pass 4   ℹ fail 0
```

Without the fix two of the four tests fail, and with it all four pass. The two that fail are the ones about the rule itself. The other two (pantry, apparel) pass either way, which is right: they check what must NOT be refused.

If a test had never been red, it would prove nothing. It could be checking something that is always true, and it would stay green with the feature missing.
