const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

const COLORS = {
  headerBg:    "1E3A5F",
  subHeaderBg: "2E75B6",
  codeBg:      "F0F4F8",
  outputBg:    "E8F5E9",
  white:       "FFFFFF",
  darkText:    "1A1A2E",
  sectionLine: "2E75B6",
};

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: COLORS.headerBg })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.sectionLine, space: 1 } },
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: COLORS.subHeaderBg })],
    spacing: { before: 320, after: 160 },
  });
}
function labelPara(label, color = COLORS.subHeaderBg) {
  return new Paragraph({
    children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color })],
    spacing: { before: 160, after: 60 },
  });
}
function normalPara(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, color: COLORS.darkText })],
    spacing: { before: 80, after: 80 },
  });
}
function codeRow(line, bg) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new TableRow({
    children: [new TableCell({
      borders, width: { size: 9360, type: WidthType.DXA },
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 40, bottom: 40, left: 180, right: 180 },
      children: [new Paragraph({
        children: [new TextRun({ text: line === "" ? " " : line, font: "Courier New", size: 18, color: COLORS.darkText })],
        spacing: { before: 10, after: 10 },
      })],
    })]
  });
}
function codeBlock(lines) {
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: lines.map(l => codeRow(l, COLORS.codeBg)) });
}
function outputBlock(lines) {
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: lines.map(l => codeRow(l, COLORS.outputBg)) });
}
function spacer(before = 120) {
  return new Paragraph({ children: [new TextRun(" ")], spacing: { before, after: 0 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ══════════════════════════════════════════════════════
// LIST — Program 1: Each function with immediate output
// ══════════════════════════════════════════════════════
// Structure: [code_lines, output_lines] pairs per function group
const listFuncBlocks = [
  {
    title: "1. append() — Add element at end",
    code:   ["fruits = ['banana', 'apple', 'cherry']", "fruits.append('mango')", "print(fruits)"],
    output: ["['banana', 'apple', 'cherry', 'mango']"],
  },
  {
    title: "2. insert() — Insert at index",
    code:   ["fruits.insert(1, 'kiwi')", "print(fruits)"],
    output: ["['banana', 'kiwi', 'apple', 'cherry', 'mango']"],
  },
  {
    title: "3. extend() — Add another list",
    code:   ["fruits.extend(['peach', 'plum'])", "print(fruits)"],
    output: ["['banana', 'kiwi', 'apple', 'cherry', 'mango', 'peach', 'plum']"],
  },
  {
    title: "4. remove() — Remove first occurrence",
    code:   ["fruits.remove('kiwi')", "print(fruits)"],
    output: ["['banana', 'apple', 'cherry', 'mango', 'peach', 'plum']"],
  },
  {
    title: "5. pop() — Remove & return last element",
    code:   ["item = fruits.pop()", "print('Popped:', item)", "print(fruits)"],
    output: ["Popped: plum", "['banana', 'apple', 'cherry', 'mango', 'peach']"],
  },
  {
    title: "6. index() — Find index of element",
    code:   ["print(fruits.index('cherry'))"],
    output: ["2"],
  },
  {
    title: "7. count() — Count occurrences",
    code:   ["fruits.append('apple')", "print(fruits.count('apple'))"],
    output: ["2"],
  },
  {
    title: "8. sort() — Sort ascending",
    code:   ["fruits.sort()", "print(fruits)"],
    output: ["['apple', 'apple', 'banana', 'cherry', 'mango', 'peach']"],
  },
  {
    title: "9. reverse() — Reverse the list",
    code:   ["fruits.reverse()", "print(fruits)"],
    output: ["['peach', 'mango', 'cherry', 'banana', 'apple', 'apple']"],
  },
  {
    title: "10. copy() — Shallow copy",
    code:   ["copy_list = fruits.copy()", "print(copy_list)"],
    output: ["['peach', 'mango', 'cherry', 'banana', 'apple', 'apple']"],
  },
  {
    title: "11. len(), min(), max(), sum()",
    code:   ["nums = [4, 1, 9, 3, 7]", "print('Length:', len(nums))", "print('Min:', min(nums))", "print('Max:', max(nums))", "print('Sum:', sum(nums))"],
    output: ["Length: 5", "Min: 1", "Max: 9", "Sum: 24"],
  },
  {
    title: "12. sorted() — Returns new sorted list",
    code:   ["print(sorted(nums))"],
    output: ["[1, 3, 4, 7, 9]"],
  },
  {
    title: "13. clear() — Remove all elements",
    code:   ["copy_list.clear()", "print(copy_list)"],
    output: ["[]"],
  },
];

// LIST — Program 2: List + Dictionary (simple)
const listProg2Code = [
  "# Program 2: List + Dictionary",
  "# Store student marks in a dictionary, use list functions",
  "",
  "marks = {",
  "    'Alice':   [85, 90, 78],",
  "    'Bob':     [70, 65, 80],",
  "    'Charlie': [95, 88, 91],",
  "}",
  "",
  "for name, score_list in marks.items():",
  "    total   = sum(score_list)",
  "    average = total / len(score_list)",
  "    highest = max(score_list)",
  "    lowest  = min(score_list)",
  "    score_list.sort()",
  "    print('Student :', name)",
  "    print('  Sorted Marks :', score_list)",
  "    print('  Total        :', total)",
  "    print('  Average      :', round(average, 2))",
  "    print('  Highest      :', highest)",
  "    print('  Lowest       :', lowest)",
  "    if average >= 85:",
  "        grade = 'A'",
  "    elif average >= 70:",
  "        grade = 'B'",
  "    else:",
  "        grade = 'C'",
  "    print('  Grade        :', grade)",
  "    print()",
  "",
  "# Sorted list of student names",
  "name_list = list(marks.keys())",
  "name_list.sort()",
  "print('Alphabetical order:', name_list)",
  "",
  "# Find top scorer simply",
  "top_name = ''",
  "top_total = 0",
  "for name, score_list in marks.items():",
  "    if sum(score_list) > top_total:",
  "        top_total = sum(score_list)",
  "        top_name  = name",
  "print('Top Scorer:', top_name)",
];
const listProg2Output = [
  "Student : Alice",
  "  Sorted Marks : [78, 85, 90]",
  "  Total        : 253",
  "  Average      : 84.33",
  "  Highest      : 90",
  "  Lowest       : 78",
  "  Grade        : B",
  "",
  "Student : Bob",
  "  Sorted Marks : [65, 70, 80]",
  "  Total        : 215",
  "  Average      : 71.67",
  "  Highest      : 80",
  "  Lowest       : 65",
  "  Grade        : B",
  "",
  "Student : Charlie",
  "  Sorted Marks : [88, 91, 95]",
  "  Total        : 274",
  "  Average      : 91.33",
  "  Highest      : 95",
  "  Lowest       : 88",
  "  Grade        : A",
  "",
  "Alphabetical order: ['Alice', 'Bob', 'Charlie']",
  "Top Scorer: Charlie",
];

// ══════════════════════════════════════════════════════
// DICTIONARY — Program 1: Each function with output
// ══════════════════════════════════════════════════════
const dictFuncBlocks = [
  {
    title: "1. Create a dictionary",
    code:   ["student = {'name': 'John', 'age': 20, 'city': 'Delhi', 'course': 'IT'}", "print(student)"],
    output: ["{'name': 'John', 'age': 20, 'city': 'Delhi', 'course': 'IT'}"],
  },
  {
    title: "2. keys() — Get all keys",
    code:   ["print(list(student.keys()))"],
    output: ["['name', 'age', 'city', 'course']"],
  },
  {
    title: "3. values() — Get all values",
    code:   ["print(list(student.values()))"],
    output: ["['John', 20, 'Delhi', 'IT']"],
  },
  {
    title: "4. items() — Get key-value pairs",
    code:   ["print(list(student.items()))"],
    output: ["[('name', 'John'), ('age', 20), ('city', 'Delhi'), ('course', 'IT')]"],
  },
  {
    title: "5. get() — Get value safely",
    code:   ["print(student.get('age'))", "print(student.get('email', 'Not Found'))"],
    output: ["20", "Not Found"],
  },
  {
    title: "6. update() — Add or change values",
    code:   ["student.update({'age': 21, 'email': 'john@mail.com'})", "print(student)"],
    output: ["{'name': 'John', 'age': 21, 'city': 'Delhi', 'course': 'IT', 'email': 'john@mail.com'}"],
  },
  {
    title: "7. setdefault() — Add key only if missing",
    code:   ["student.setdefault('phone', '9999999999')", "print(student.get('phone'))"],
    output: ["9999999999"],
  },
  {
    title: "8. pop() — Remove key & return value",
    code:   ["removed = student.pop('city')", "print('Removed:', removed)"],
    output: ["Removed: Delhi"],
  },
  {
    title: "9. popitem() — Remove last inserted pair",
    code:   ["last = student.popitem()", "print('Popped item:', last)"],
    output: ["Popped item: ('phone', '9999999999')"],
  },
  {
    title: "10. copy() — Shallow copy",
    code:   ["copy_s = student.copy()", "print(copy_s)"],
    output: ["{'name': 'John', 'age': 21, 'course': 'IT', 'email': 'john@mail.com'}"],
  },
  {
    title: "11. fromkeys() — Create dict from key list",
    code:   ["keys = ['a', 'b', 'c']", "new_d = dict.fromkeys(keys, 0)", "print(new_d)"],
    output: ["{'a': 0, 'b': 0, 'c': 0}"],
  },
  {
    title: "12. len() and 'in' operator",
    code:   ["print('Length:', len(student))", "print('name in dict:', 'name' in student)"],
    output: ["Length: 4", "name in dict: True"],
  },
  {
    title: "13. clear() — Remove all items",
    code:   ["new_d.clear()", "print(new_d)"],
    output: ["{}"],
  },
];

// DICTIONARY — Program 2: Dictionary + Set (simple)
const dictProg2Code = [
  "# Program 2: Dictionary + Set",
  "# Library tracker: book -> set of borrowers",
  "",
  "library = {",
  "    'Python Basics':   {'Alice', 'Bob', 'Charlie'},",
  "    'Data Structures': {'Bob', 'Diana', 'Eve'},",
  "    'Web Dev':         {'Alice', 'Eve', 'Frank'},",
  "}",
  "",
  "# All books",
  "print('Books:', list(library.keys()))",
  "",
  "# Borrower count per book",
  "print('\\nBorrower Count:')",
  "for book, borrowers in library.items():",
  "    print(' ', book, ':', len(borrowers))",
  "",
  "# All unique borrowers (union of all sets)",
  "all_borrowers = set()",
  "for borrowers in library.values():",
  "    all_borrowers = all_borrowers | borrowers",
  "print('\\nAll Borrowers:', all_borrowers)",
  "",
  "# Common borrowers in two books",
  "common = library['Python Basics'] & library['Data Structures']",
  "print('\\nIn both Python Basics & Data Structures:', common)",
  "",
  "# Only in Python Basics",
  "only = library['Python Basics'] - library['Data Structures']",
  "print('Only in Python Basics:', only)",
  "",
  "# Add a new borrower",
  "library['Python Basics'].add('Grace')",
  "print('\\nAfter adding Grace:', library['Python Basics'])",
];
const dictProg2Output = [
  "Books: ['Python Basics', 'Data Structures', 'Web Dev']",
  "",
  "Borrower Count:",
  "  Python Basics : 3",
  "  Data Structures : 3",
  "  Web Dev : 3",
  "",
  "All Borrowers: {'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'}",
  "",
  "In both Python Basics & Data Structures: {'Bob'}",
  "Only in Python Basics: {'Alice', 'Charlie'}",
  "",
  "After adding Grace: {'Alice', 'Bob', 'Charlie', 'Grace'}",
];

// ══════════════════════════════════════════════════════
// SET — Program 1: Each function with output
// ══════════════════════════════════════════════════════
const setFuncBlocks = [
  {
    title: "1. Create sets",
    code:   ["A = {1, 2, 3, 4, 5}", "B = {4, 5, 6, 7, 8}", "print('A:', A)", "print('B:', B)"],
    output: ["A: {1, 2, 3, 4, 5}", "B: {4, 5, 6, 7, 8}"],
  },
  {
    title: "2. add() — Add single element",
    code:   ["A.add(6)", "print(A)"],
    output: ["{1, 2, 3, 4, 5, 6}"],
  },
  {
    title: "3. update() — Add multiple elements",
    code:   ["A.update([10, 11])", "print(A)"],
    output: ["{1, 2, 3, 4, 5, 6, 10, 11}"],
  },
  {
    title: "4. remove() — Remove element (error if absent)",
    code:   ["A.remove(11)", "print(A)"],
    output: ["{1, 2, 3, 4, 5, 6, 10}"],
  },
  {
    title: "5. discard() — Remove element (no error if absent)",
    code:   ["A.discard(99)   # 99 not in A, no error", "print(A)"],
    output: ["{1, 2, 3, 4, 5, 6, 10}"],
  },
  {
    title: "6. pop() — Remove arbitrary element",
    code:   ["elem = A.pop()", "print('Popped:', elem)"],
    output: ["Popped: 1"],
  },
  {
    title: "7. union() — All elements from both",
    code:   ["A = {1, 2, 3, 4, 5}  # reset", "print(A | B)"],
    output: ["{1, 2, 3, 4, 5, 6, 7, 8}"],
  },
  {
    title: "8. intersection() — Common elements",
    code:   ["print(A & B)"],
    output: ["{4, 5}"],
  },
  {
    title: "9. difference() — In A but not B",
    code:   ["print(A - B)"],
    output: ["{1, 2, 3}"],
  },
  {
    title: "10. symmetric_difference() — In A or B, not both",
    code:   ["print(A ^ B)"],
    output: ["{1, 2, 3, 6, 7, 8}"],
  },
  {
    title: "11. issubset() and issuperset()",
    code:   ["C = {1, 2}", "print('C subset of A:', C.issubset(A))", "print('A superset of C:', A.issuperset(C))"],
    output: ["C subset of A: True", "A superset of C: True"],
  },
  {
    title: "12. isdisjoint() — No common elements",
    code:   ["D = {100, 200}", "print(A.isdisjoint(D))"],
    output: ["True"],
  },
  {
    title: "13. len(), min(), max()",
    code:   ["print('len:', len(A), '| min:', min(A), '| max:', max(A))"],
    output: ["len: 5 | min: 1 | max: 5"],
  },
  {
    title: "14. copy() and clear()",
    code:   ["copy_A = A.copy()", "copy_A.clear()", "print(copy_A)"],
    output: ["set()"],
  },
  {
    title: "15. frozenset() — Immutable set",
    code:   ["fs = frozenset([1, 2, 3])", "print(fs)"],
    output: ["frozenset({1, 2, 3})"],
  },
];

// SET — Program 2: Set + Tuple (simple)
const setProg2Code = [
  "# Program 2: Set + Tuple",
  "# Course enrollment using tuples as records",
  "",
  "# Each tuple = (student, course)",
  "enrollments = [",
  "    ('Alice',   'Python'),",
  "    ('Bob',     'Java'),",
  "    ('Charlie', 'Python'),",
  "    ('Alice',   'Web Dev'),",
  "    ('Diana',   'Java'),",
  "    ('Bob',     'Python'),",
  "]",
  "",
  "# Unique courses",
  "courses = set()",
  "for student, course in enrollments:",
  "    courses.add(course)",
  "print('All Courses:', courses)",
  "",
  "# Unique students",
  "students = set()",
  "for student, course in enrollments:",
  "    students.add(student)",
  "print('All Students:', students)",
  "",
  "# Students per course",
  "print('\\nStudents per Course:')",
  "for c in sorted(courses):",
  "    group = set()",
  "    for student, course in enrollments:",
  "        if course == c:",
  "            group.add(student)",
  "    print(' ', c, ':', group)",
  "",
  "# Students in both Python AND Java",
  "py   = {s for s, c in enrollments if c == 'Python'}",
  "java = {s for s, c in enrollments if c == 'Java'}",
  "print('\\nIn both Python & Java:', py & java)",
  "print('Only Python:', py - java)",
  "",
  "# Tuple unpacking display",
  "print('\\nAll Records:')",
  "for student, course in enrollments:",
  "    print(f'  {student} -> {course}')",
];
const setProg2Output = [
  "All Courses: {'Java', 'Python', 'Web Dev'}",
  "All Students: {'Alice', 'Bob', 'Charlie', 'Diana'}",
  "",
  "Students per Course:",
  "  Java : {'Bob', 'Diana'}",
  "  Python : {'Alice', 'Bob', 'Charlie'}",
  "  Web Dev : {'Alice'}",
  "",
  "In both Python & Java: {'Bob'}",
  "Only Python: {'Alice', 'Charlie'}",
  "",
  "All Records:",
  "  Alice -> Python",
  "  Bob -> Java",
  "  Charlie -> Python",
  "  Alice -> Web Dev",
  "  Diana -> Java",
  "  Bob -> Python",
];

// ══════════════════════════════════════════════════════
// TUPLE — Program 1: Each function with output
// ══════════════════════════════════════════════════════
const tupleFuncBlocks = [
  {
    title: "1. Create a tuple",
    code:   ["colors = ('red', 'blue', 'green', 'red', 'yellow')", "nums = (5, 3, 8, 1, 9)", "print(colors)", "print(nums)"],
    output: ["('red', 'blue', 'green', 'red', 'yellow')", "(5, 3, 8, 1, 9)"],
  },
  {
    title: "2. count() — Count occurrences",
    code:   ["print(colors.count('red'))"],
    output: ["2"],
  },
  {
    title: "3. index() — Find index of value",
    code:   ["print(colors.index('green'))"],
    output: ["2"],
  },
  {
    title: "4. len(), min(), max(), sum()",
    code:   ["print('len:', len(nums))", "print('min:', min(nums))", "print('max:', max(nums))", "print('sum:', sum(nums))"],
    output: ["len: 5", "min: 1", "max: 9", "sum: 26"],
  },
  {
    title: "5. sorted() — Returns sorted list",
    code:   ["print(sorted(nums))"],
    output: ["[1, 3, 5, 8, 9]"],
  },
  {
    title: "6. Indexing and Slicing",
    code:   ["print('First:', colors[0])", "print('Last:', colors[-1])", "print('Slice [1:3]:', colors[1:3])", "print('Reverse:', colors[::-1])"],
    output: ["First: red", "Last: yellow", "Slice [1:3]: ('blue', 'green')", "Reverse: ('yellow', 'red', 'green', 'blue', 'red')"],
  },
  {
    title: "7. Concatenation (+) and Repetition (*)",
    code:   ["t1 = (1, 2, 3)", "t2 = (4, 5, 6)", "print(t1 + t2)", "print(t1 * 2)"],
    output: ["(1, 2, 3, 4, 5, 6)", "(1, 2, 3, 1, 2, 3)"],
  },
  {
    title: "8. Membership (in / not in)",
    code:   ["print('red' in colors)", "print('pink' not in colors)"],
    output: ["True", "True"],
  },
  {
    title: "9. Tuple Unpacking",
    code:   ["a, b, c = (10, 20, 30)", "print(a, b, c)"],
    output: ["10 20 30"],
  },
  {
    title: "10. Nested Tuple",
    code:   ["nested = ((1, 2), (3, 4), (5, 6))", "print(nested[1][0])"],
    output: ["3"],
  },
  {
    title: "11. Convert list <-> tuple",
    code:   ["lst = [7, 8, 9]", "tup = tuple(lst)", "print(tup)", "print(list(tup))"],
    output: ["(7, 8, 9)", "[7, 8, 9]"],
  },
  {
    title: "12. zip() with tuples",
    code:   ["names = ('Alice', 'Bob', 'Charlie')", "marks = (85, 72, 91)", "print(list(zip(names, marks)))"],
    output: ["[('Alice', 85), ('Bob', 72), ('Charlie', 91)]"],
  },
];

// TUPLE — Program 2: Tuple + List (simple)
const tupleProg2Code = [
  "# Program 2: Tuple + List",
  "# Employee records as tuples stored in a list",
  "",
  "# (id, name, department, salary)",
  "employees = [",
  "    (101, 'John',    'HR',      45000),",
  "    (102, 'Bob',     'IT',      72000),",
  "    (103, 'Charlie', 'IT',      68000),",
  "    (104, 'Diana',   'Finance', 55000),",
  "    (105, 'Eve',     'HR',      48000),",
  "    (106, 'Frank',   'IT',      80000),",
  "]",
  "",
  "# Display all employees",
  "print('ID   Name      Dept       Salary')",
  "print('-' * 38)",
  "for emp in employees:",
  "    print(emp[0], emp[1], emp[2], emp[3])",
  "",
  "# Total salary",
  "total = 0",
  "for emp in employees:",
  "    total = total + emp[3]",
  "print('\\nTotal Salary:', total)",
  "",
  "# Average salary",
  "average = total / len(employees)",
  "print('Average Salary:', round(average, 2))",
  "",
  "# IT department employees",
  "print('\\nIT Department:')",
  "for emp in employees:",
  "    if emp[2] == 'IT':",
  "        print(' ', emp[1], '-', emp[3])",
  "",
  "# Highest paid employee",
  "high_emp = employees[0]",
  "for emp in employees:",
  "    if emp[3] > high_emp[3]:",
  "        high_emp = emp",
  "print('\\nHighest Paid:', high_emp[1], '(', high_emp[3], ')')",
  "",
  "# Sort by salary (simple bubble sort on list of tuples)",
  "sorted_emps = sorted(employees, key=lambda e: e[3], reverse=True)",
  "print('\\nSalary Ranking:')",
  "rank = 1",
  "for emp in sorted_emps:",
  "    print(rank, '.', emp[1], '-', emp[3])",
  "    rank = rank + 1",
];
const tupleProg2Output = [
  "ID   Name      Dept       Salary",
  "--------------------------------------",
  "101 John    HR      45000",
  "102 Bob     IT      72000",
  "103 Charlie IT      68000",
  "104 Diana   Finance 55000",
  "105 Eve     HR      48000",
  "106 Frank   IT      80000",
  "",
  "Total Salary: 368000",
  "Average Salary: 61333.33",
  "",
  "IT Department:",
  "  Bob - 72000",
  "  Charlie - 68000",
  "  Frank - 80000",
  "",
  "Highest Paid: Frank ( 80000 )",
  "",
  "Salary Ranking:",
  "1 . Frank - 80000",
  "2 . Bob - 72000",
  "3 . Charlie - 68000",
  "4 . Diana - 55000",
  "5 . Eve - 48000",
  "6 . John - 45000",
];

// ══════════════════════════════════════════════════════
// BUILDER: Program 1 (interleaved code+output per func)
// ══════════════════════════════════════════════════════
function buildFuncProgram(blocks) {
  const children = [];
  for (const blk of blocks) {
    children.push(new Paragraph({
      children: [new TextRun({ text: blk.title, font: "Arial", size: 20, bold: true, color: COLORS.headerBg })],
      spacing: { before: 200, after: 60 },
    }));
    children.push(codeBlock(blk.code));
    children.push(spacer(60));
    children.push(labelPara("Output:", "2E7D32"));
    children.push(spacer(40));
    children.push(outputBlock(blk.output));
    children.push(spacer(80));
  }
  return children;
}

// ══════════════════════════════════════════════════════
// COVER PAGE
// ══════════════════════════════════════════════════════
const coverPage = [
  spacer(1440),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Python Seminar", font: "Arial", size: 56, bold: true, color: COLORS.headerBg })],
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Lists · Dictionaries · Sets · Tuples", font: "Arial", size: 32, color: COLORS.subHeaderBg })],
    spacing: { before: 0, after: 600 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Programs with Functions & Combinations", font: "Arial", size: 26, italics: true, color: COLORS.darkText })],
    spacing: { before: 0, after: 800 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Information Technology Department", font: "Arial", size: 24, color: COLORS.darkText })],
    spacing: { before: 0, after: 120 },
  }),
  pageBreak(),
];

// ══════════════════════════════════════════════════════
// ASSEMBLE ALL CHILDREN
// ══════════════════════════════════════════════════════
const allChildren = [
  ...coverPage,

  // ── LIST ──
  pageBreak(),
  heading1("📋  LIST"),
  spacer(80),

  heading2("Program 1: All List Functions (with immediate output)"),
  spacer(60),
  ...buildFuncProgram(listFuncBlocks),

  spacer(200),
  heading2("Program 2: Combination — List + Dictionary"),
  normalPara("Application: Student Grade Manager — marks stored as lists inside a dictionary."),
  spacer(80),
  labelPara("📝  Source Code", COLORS.subHeaderBg),
  spacer(60),
  codeBlock(listProg2Code),
  spacer(120),
  labelPara("▶  Output", "2E7D32"),
  spacer(60),
  outputBlock(listProg2Output),

  // ── DICTIONARY ──
  pageBreak(),
  heading1("📖  DICTIONARY"),
  spacer(80),

  heading2("Program 1: All Dictionary Functions (with immediate output)"),
  spacer(60),
  ...buildFuncProgram(dictFuncBlocks),

  spacer(200),
  heading2("Program 2: Combination — Dictionary + Set"),
  normalPara("Application: Library Book Tracker — each book maps to a set of borrowers."),
  spacer(80),
  labelPara("📝  Source Code", COLORS.subHeaderBg),
  spacer(60),
  codeBlock(dictProg2Code),
  spacer(120),
  labelPara("▶  Output", "2E7D32"),
  spacer(60),
  outputBlock(dictProg2Output),

  // ── SET ──
  pageBreak(),
  heading1("🔵  SET"),
  spacer(80),

  heading2("Program 1: All Set Functions (with immediate output)"),
  spacer(60),
  ...buildFuncProgram(setFuncBlocks),

  spacer(200),
  heading2("Program 2: Combination — Set + Tuple"),
  normalPara("Application: Course Enrollment System — enrollments stored as tuples, sets used for unique lookups."),
  spacer(80),
  labelPara("📝  Source Code", COLORS.subHeaderBg),
  spacer(60),
  codeBlock(setProg2Code),
  spacer(120),
  labelPara("▶  Output", "2E7D32"),
  spacer(60),
  outputBlock(setProg2Output),

  // ── TUPLE ──
  pageBreak(),
  heading1("🔒  TUPLE"),
  spacer(80),

  heading2("Program 1: All Tuple Functions & Operations (with immediate output)"),
  spacer(60),
  ...buildFuncProgram(tupleFuncBlocks),

  spacer(200),
  heading2("Program 2: Combination — Tuple + List"),
  normalPara("Application: Employee Records System — each employee is a tuple, all stored in a list."),
  spacer(80),
  labelPara("📝  Source Code", COLORS.subHeaderBg),
  spacer(60),
  codeBlock(tupleProg2Code),
  spacer(120),
  labelPara("▶  Output", "2E7D32"),
  spacer(60),
  outputBlock(tupleProg2Output),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
      },
    },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Python_Seminar_Programs.docx', buf);
  console.log('Done!');
});