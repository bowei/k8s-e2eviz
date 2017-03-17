class Node(object):
  def __init__(self):
    self.children = {}
    self.value = None

  def insert(self, path, value):
    if path == []:
      if self.value is not None:
        raise RuntimeError('path is a duplicate: {} {}: {}'.format(path, value, self.value))
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

  def _merge(self):
    if len(self.children) == 1:
      k, child = self.children.items()[0]

  def dump(self, indent=0):
    if self.value:
      print '{}>{}'.format(' '*indent, self.value)
    for c in self.children:
      print '{}{}'.format(' '*indent, c)
      self.children[c].dump(indent+1)

def createPrefixTree(m):
  root = Node()
  for s in m:
    root.insert(s.split(), m[s])
  return root

import json

T = {}
line = 0
tns = set()

for row in json.load(open('out.json')):
  if row['test_name'] is None: continue
  tns.add(' '.join(row['test_name'].split()))

for tn in tns:
  if tn is None: continue
  if not tn.startswith('[k8s.io]'): continue
  # print '{}: {}'.format(line, tn)
  T[tn] = line
  line += 1

root = createPrefixTree(T).optimize()
root.dump()
