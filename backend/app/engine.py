import re
from typing import Any

RULES = [
    {'id':'unilateral-termination','name':'Unilateral termination','severity':'high','category':'Termination','patterns':[r'(?i)terminate (?:this )?agreement at (?:its|their|our) sole discretion',r'(?i)terminate (?:at any time|without (?:cause|notice))'], 'explanation':'A party may end the agreement without balanced protections.', 'action':'Ask for a reasonable notice period and mutual termination rights.'},
    {'id':'uncapped-liability','name':'Uncapped liability','severity':'high','category':'Liability','patterns':[r'(?i)unlimited liability',r'(?i)liable for all (?:damages|losses)',r'(?i)without limitation of liability'], 'explanation':'Potential exposure may be open-ended.', 'action':'Review liability caps and exclusions with a qualified professional.'},
    {'id':'auto-renewal','name':'Automatic renewal','severity':'medium','category':'Renewal','patterns':[r'(?i)automatic(?:ally)? renew',r'(?i)renew(?:ed|s)? automatically'], 'explanation':'The contract may renew unless cancelled in time.', 'action':'Verify renewal dates, notice period and cancellation method.'},
    {'id':'non-refundable','name':'Non-refundable payment','severity':'medium','category':'Payments','patterns':[r'(?i)non[- ]refundable',r'(?i)no refunds? (?:will be|shall be|are) (?:provided|issued|given)'], 'explanation':'Payments may be difficult to recover.', 'action':'Review refund exceptions and service failure remedies.'},
    {'id':'unilateral-changes','name':'Unilateral amendment','severity':'high','category':'Changes','patterns':[r'(?i)modify (?:these )?terms at (?:its|our) sole discretion',r'(?i)change (?:the )?terms without (?:prior )?notice'], 'explanation':'Terms may change without meaningful agreement.', 'action':'Request written notice and a right to reject material changes.'},
    {'id':'data-sharing','name':'Broad data sharing','severity':'medium','category':'Privacy','patterns':[r'(?i)share (?:your|customer|personal) data with (?:any|third.parties|partners)',r'(?i)sell (?:your|personal) (?:data|information)'], 'explanation':'Personal information may be shared broadly.', 'action':'Review data recipients, purpose, retention, and opt-out rights.'},
    {'id':'arbitration','name':'Mandatory arbitration','severity':'low','category':'Disputes','patterns':[r'(?i)binding arbitration',r'(?i)waive (?:the )?right to (?:a )?(?:jury trial|sue)'], 'explanation':'Dispute resolution options may be limited.', 'action':'Review dispute resolution costs, forum and applicable law.'},
    {'id':'exclusivity','name':'Exclusivity obligation','severity':'medium','category':'Restrictions','patterns':[r'(?i)exclusive(?:ly)? (?:provide|work|deal)',r'(?i)shall not (?:work|contract) with (?:any )?competitors'], 'explanation':'The clause may constrain working with others.', 'action':'Confirm the exclusivity term, geography and scope.'},
]
WEIGHTS = {'high':25,'medium':13,'low':6}

def analyze_contract(text: str) -> dict[str, Any]:
    text = text.strip()
    if len(text) < 30:
        raise ValueError('Contract text must contain at least 30 characters.')
    findings = []
    for rule in RULES:
        for pattern in rule['patterns']:
            match = re.search(pattern, text)
            if match:
                left = max(0, match.start()-90)
                right = min(len(text), match.end()+110)
                excerpt = text[left:right].strip()
                findings.append({
                    'rule_id':rule['id'], 'title':rule['name'], 'severity':rule['severity'],
                    'category':rule['category'], 'excerpt':excerpt,
                    'explanation':rule['explanation'], 'recommendation':rule['action'],
                    'start':left,'end':right,'source':'rules'
                })
                break
    score = min(100, sum(WEIGHTS[f['severity']] for f in findings))
    level = 'high' if score >= 60 else 'medium' if score >= 25 else 'low'
    return {'score':score, 'level':level, 'findings':findings,
            'summary':f'{len(findings)} potential concern(s) identified. This screening does not determine legal validity or guarantee safety.',
            'engine':'rules','characters':len(text)}
