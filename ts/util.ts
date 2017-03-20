/*
Copyright 2017 The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
namespace util {

const STOP_WORDS: [String] = [
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

/** Split a test description string. */
export function splitTestDescription(desc: String) {
    let l = desc.split(/\s+/);
    let cur = [];
    let ret = [];
    
    for (let i=0; i<l.length; ++i) {
        cur.push(l[i]);
        if (STOP_WORDS.indexOf(l[i]) < 0) {
            ret.push(cur.join(' '));
            cur = [];
        }
    }
    
    return ret;
}

/** Split a job name. */
export function splitJob(job: String) {
    return job.split(/-/);
}

} // namespace