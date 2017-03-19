#!/usr/bin/env python
import json

FLUFF = [
    'a',
    'be',
    'for',
    'have',
    'not',
    'should',
    'that',
    'the',
    'with',
]

def smartSplit(s):
  s = s.split()
  ret = []
  cur = []
  for word in s:
    cur.append(word)
    if word not in FLUFF:
      ret.append(' '.join(cur))
      cur = []
  return ret

class Node(object):
  def __init__(self):
    self.children = {}
    self.value = None

  def insert(self, path, value):
    if path == []:
      if self.value is not None:
        raise RuntimeError(
            'path is a duplicate: {} {}: {}'.format(path, value, self.value))
      self.value = value
      return

    if path[0] not in self.children:
      self.children[path[0]] = Node()
    try:
      self.children[path[0]].insert(path[1:], value)
    except:
      print path
      raise

  def optimize(self):
    if len(self.children) == 0:
      return self

    root = Node()
    root.value = self.value
    for c in self.children:
      child = self.children[c]

      while child.value is None and len(child.children) == 1:
        label, next = child.children.items()[0]
        c = c + ' ' + label
        child = next

      root.children[c] = child.optimize()

    return root

  def count(self):
    ret = sum([child.count() for child in self.children.values()])
    if self.value: ret += 1
    return ret

  def dump(self, indent=0):
    if self.value:
      print '{}>{}'.format(' '*indent, self.value)
    for c in self.children:
      print '{}{}'.format(' '*indent, c)
      self.children[c].dump(indent+1)

  def dumph(self, indent=0):
    if self.value:
      print '{}<i>{}</i>'.format(' '*indent, self.value)
    if self.children:
      if indent == 0:
        print '{}<ul id="the_list">'.format(' '*indent)
      else:
        print '{}<ul>'.format(' '*indent)
      for c in sorted(self.children):
        print '{}<li>'.format(' '*indent)
        print '{}{} - {}'.format(' '*indent, c, self.children[c].count())
        self.children[c].dumph(indent+1)
        print '{}</li>'.format(' '*indent)
      print '{}</ul>'.format(' '*indent)

  def walkKeys(self, fcn):
    for c in self.children:
      fcn(c)
      self.children[c].walkKeys(fcn)

  def dumpTable(self, indent=0):
    for c in sorted(self.children):
      print '<tr><td>{}</td></tr>'.format(c)

def createPrefixTree(m):
  root = Node()
  for s in m:
    root.insert(smartSplit(s), m[s])
  return root

jobs = set()
for row in json.load(open('jobs.json')):
  if row['job'] is None: continue
  jobs.add(row['job'])

T = {}
line = 0
tns = set()

for row in json.load(open('tests.json')):
  if row['test_name'] is None: continue
  tns.add(' '.join(row['test_name'].split()))

for tn in tns:
  if tn is None: continue
  if not tn.startswith('[k8s.io]'): continue
  T[tn] = line
  line += 1

singletons = set()
def collectSingleton(name):
  if len(name.split()) == 1:
    singletons.add(name)

print """
<!DOCTYPE HTML>
<head></head>
<body>
"""

root = createPrefixTree(T).optimize()
root.dumph()
root.walkKeys(collectSingleton)

print '<hr>'
print '<ul>'
for sing in singletons:
  print '<li>{}</li>'.format(sing)
print '</ul>'

print '<hr>'
print '<ul>'
for job in sorted(jobs):
  print '<li>{}</li>'.format(job)
print '</ul>'

print '<hr>'
print '<table border="2">'
root.children['[k8s.io]'].dumpTable()
print '</table>'

print """
<script src="col.js"></script>
<script>
CollapsibleLists.applyTo(document.getElementById('the_list'));
</script>
</body>
"""
