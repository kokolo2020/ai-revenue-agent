import unittest
from business_research import evaluate,rank
BASE={"title":"Test SaaS","customer_evidence_url":"https://example.com/a",
"recurring_spend_evidence_url":"https://example.com/b",
"pain_evidence_url":"https://example.com/c",
"competitor_evidence_url":"https://example.com/d",
"pain_severity":5,"recurrence":5,"willingness_to_pay":4,
"build_feasibility":4,"distribution_access":3,"differentiation":3}
class ResearchTests(unittest.TestCase):
    def test_empty_evidence_is_not_verified(self):
        self.assertEqual(evaluate({"title":"Idea"})["status"],"RESEARCH_REQUIRED")
    def test_link_only_requires_validation(self):
        self.assertEqual(evaluate(BASE)["status"],"HUMAN_VALIDATION_REQUIRED")
    def test_scores(self):
        self.assertEqual(evaluate(BASE)["score"],85)
    def test_invalid_scores(self):
        self.assertEqual(evaluate({**BASE,"recurrence":6})["status"],"REJECT")
    def test_ranking(self):
        self.assertEqual(rank([{"title":"Unknown"},BASE])[0]["title"],"Test SaaS")
if __name__=="__main__":unittest.main()
