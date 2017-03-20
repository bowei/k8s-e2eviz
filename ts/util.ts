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