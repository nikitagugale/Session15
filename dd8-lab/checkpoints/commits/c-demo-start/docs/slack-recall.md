# #bopis-eligibility: mid-sprint, about recalls

**Priya (supply chain):** heads up, the supplier flagged a batch of kettles for recall. Inventory now sets supplier_recall=true on those SKUs.

**Dana (product owner):** ok so BOPIS eligibility has to exclude anything with supplier_recall=true too. We can't hand a recalled item to a customer at the curb.

**Raj (developer):** makes sense. I'll add it after the release.

**Dana:** 👍 we should put it in the spec when we get a minute
