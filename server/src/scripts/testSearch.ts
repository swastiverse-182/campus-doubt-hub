import { buildQuestionSearchFilter, buildSuggestionSearchFilter, extractKeywords, escapeRegex } from '../utils/searchHelper';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('\n--- Testing Search Helper Logic ---\n');

// 1. Test escapeRegex
assert(escapeRegex('mongo? (cluster) [test]*') === 'mongo\\?\\ \\(cluster\\)\\ \\[test\\]\\*', 'Escapes regex characters');

// 2. Test extractKeywords
assert(JSON.stringify(extractKeywords('How to get MongoDB password?')) === JSON.stringify(['How', 'to', 'get', 'MongoDB', 'password']), 'Extracts keywords and strips trailing question mark');
assert(JSON.stringify(extractKeywords('mo')) === JSON.stringify(['mo']), 'Extracts 2-letter keyword');
assert(JSON.stringify(extractKeywords('cl')) === JSON.stringify(['cl']), 'Extracts 2-letter keyword cl');

// 3. Test buildQuestionSearchFilter with 2-letter inputs
const filterMo = buildQuestionSearchFilter('mo');
assert(Boolean(filterMo.$or), '2-letter query produces $or across fields');
assert(filterMo.$or.length === 3, '$or covers title, description, and tags');
assert(filterMo.$or[0].title.$regex === 'mo', 'Title regex is "mo"');

// 4. Test simulated matching on sample questions
const sampleQuestions = [
  {
    title: 'How to get a cluster mongo URI?',
    description: 'Where can I find the cluster connection URI in MongoDB Atlas, and how do I format it for Node.js?',
    tags: ['Team & Code Engineering']
  },
  {
    title: 'How to get MongoDB password?',
    description: 'How do I reset or find the database user password in MongoDB Atlas under Database Access?',
    tags: ['Team & Code Engineering']
  },
  {
    title: 'NOC Compliance and verification',
    description: 'Guidelines on NOC submission before the deadline',
    tags: ['NOC Compliance']
  }
];

function testQueryMatch(query: string, question: typeof sampleQuestions[0]): boolean {
  const filter = buildQuestionSearchFilter(query);
  if (filter.$or) {
    return filter.$or.some((clause: any) => {
      if (clause.title) {
        return new RegExp(clause.title.$regex, clause.title.$options).test(question.title);
      }
      if (clause.description) {
        return new RegExp(clause.description.$regex, clause.description.$options).test(question.description);
      }
      if (clause.tags) {
        return question.tags.some(t => new RegExp(clause.tags.$regex, clause.tags.$options).test(t));
      }
      return false;
    });
  }
  if (filter.$and) {
    return filter.$and.every((subFilter: any) => {
      return subFilter.$or.some((clause: any) => {
        if (clause.title) {
          return new RegExp(clause.title.$regex, clause.title.$options).test(question.title);
        }
        if (clause.description) {
          return new RegExp(clause.description.$regex, clause.description.$options).test(question.description);
        }
        if (clause.tags) {
          return question.tags.some(t => new RegExp(clause.tags.$regex, clause.tags.$options).test(t));
        }
        return false;
      });
    });
  }
  return false;
}

// Check 2-letter "mo":
const moMatches = sampleQuestions.filter(q => testQueryMatch('mo', q));
assert(moMatches.length === 2, '2-letter "mo" matches both "cluster mongo URI" and "MongoDB password"');
console.log(`   Matches for "mo": ${moMatches.map(q => `"${q.title}"`).join(', ')}`);

// Check 2-letter "cl":
const clMatches = sampleQuestions.filter(q => testQueryMatch('cl', q));
assert(clMatches.length === 1 && clMatches[0].title.includes('cluster'), '2-letter "cl" matches "cluster mongo URI"');
console.log(`   Matches for "cl": ${clMatches.map(q => `"${q.title}"`).join(', ')}`);

// Check 2-letter "pa":
const paMatches = sampleQuestions.filter(q => testQueryMatch('pa', q));
assert(paMatches.length === 1 && paMatches[0].title.includes('password'), '2-letter "pa" matches "MongoDB password"');
console.log(`   Matches for "pa": ${paMatches.map(q => `"${q.title}"`).join(', ')}`);

// Check 2-letter "UR":
const urMatches = sampleQuestions.filter(q => testQueryMatch('UR', q));
assert(urMatches.length === 1 && urMatches[0].title.includes('URI'), '2-letter "UR" matches "cluster mongo URI"');
console.log(`   Matches for "UR": ${urMatches.map(q => `"${q.title}"`).join(', ')}`);

// Check full question with question mark:
const fullQ1Matches = sampleQuestions.filter(q => testQueryMatch('How to get a cluster mongo URI?', q));
assert(fullQ1Matches.length === 1 && fullQ1Matches[0].title.includes('cluster mongo URI'), 'Full question "How to get a cluster mongo URI?" matches correctly');

const fullQ2Matches = sampleQuestions.filter(q => testQueryMatch('How to get MongoDB password?', q));
assert(fullQ2Matches.length === 1 && fullQ2Matches[0].title.includes('MongoDB password'), 'Full question "How to get MongoDB password?" matches correctly');

// Check autocomplete suggestion filter:
const sugFilter = buildSuggestionSearchFilter('mo');
assert(Boolean(sugFilter.$or), 'Suggestion filter created for "mo"');

console.log('\n🎉 ALL SEARCH UNIT TESTS PASSED SUCCESSFULLY!\n');
