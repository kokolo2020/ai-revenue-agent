import unittest
from scanner import decision,scan
BASE=dict(reward_usd=100,platform_fee_pct=20,estimated_cost_usd=5,estimated_win_probability=.25,
          funding_verified=True,issue_open_verified=True,no_competing_accepted_pr=True,
          ai_assistance_permitted=True,payout_eligible=True,scope_feasible=True)
class Tests(unittest.TestCase):
    def test_positive_needs_approval(self): self.assertEqual(decision(BASE)["decision"],"HUMAN_REVIEW_REQUIRED")
    def test_missing_verification_holds(self): self.assertEqual(decision({**BASE,"funding_verified":None})["decision"],"HOLD")
    def test_closed_rejected(self): self.assertEqual(decision({**BASE,"issue_open_verified":False})["decision"],"REJECT")
    def test_cost_over_500_cap(self): self.assertEqual(decision({**BASE,"estimated_cost_usd":501})["decision"],"REJECT")
    def test_cost_under_cap_not_automatically_approved(self): self.assertEqual(decision({**BASE,"reward_usd":3000,"estimated_cost_usd":250})["decision"],"HUMAN_REVIEW_REQUIRED")
    def test_loss_rejected(self): self.assertEqual(decision({**BASE,"estimated_win_probability":0.01})["decision"],"REJECT")
    def test_duplicate(self):
        a={"url":"https://example.com/job","title":"task",**BASE}
        self.assertEqual(len(scan([a,a])),1)
    def test_bad_url(self): self.assertEqual(scan([{"url":"javascript:alert(1)"}])[0]["decision"],"REJECT")
if __name__=="__main__":unittest.main()
