use std::collections::HashMap;
use std::collections::LinkedList;
use std::hash::Hash;

// Custom implementation of a LinkedHashMap
pub struct LinkedHashMap<K, V> {
    map: HashMap<K, V>,
    list: LinkedList<K>,
}

impl<K, V> LinkedHashMap<K, V>
where
    K: Eq + Hash + Clone,
{
    pub(crate) fn new() -> Self {
        LinkedHashMap {
            map: HashMap::new(),
            list: LinkedList::new(),
        }
    }

    pub(crate) fn insert(&mut self, key: K, value: V) -> Option<V> {
        if let Some(old_value) = self.map.insert(key.clone(), value) {
            return Some(old_value);
        }
        self.list.push_back(key);
        None
    }

    pub(crate) fn get(&self, key: &K) -> Option<&V> {
        self.map.get(key)
    }

    pub(crate) fn remove(&mut self, key: &K) -> Option<V> {
        if let Some(value) = self.map.remove(key) {
            self.list = self.list.iter().cloned().filter(|k| k != key).collect();
            return Some(value);
        }
        None
    }

    pub(crate) fn iter(&self) -> std::collections::hash_map::Iter<K, V> {
        self.map.iter()
    }
}

pub fn substring(s: &str, range: std::ops::Range<usize>) -> &str {
    // Ensure the range is within the valid boundaries of the string
    let start = range.start.min(s.len());
    // Ensure the end index is not less than the start index
    let end = range.end.min(s.len()).max(start);
    &s[start..end]
}
