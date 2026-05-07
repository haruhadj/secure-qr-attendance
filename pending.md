### 📝 Development To-Do List

import masterlist data feature
- create a instruction file in the project folder called how_to_import_masterlist.md on how to create structured csv file for importing a masterlist data, heres the sample data should be like this:
the data should have include the name of the teacher, and the rest is for the students info that are already in the database

```
{
  "classroom_section_or_course": "Grade 10 - Newton",
  "teacher": "Mr. Julian Vance",
  "students": [
    {
      "student_lrn_or_student_id_number": "2026-001",
      "student_name": "Alice Sterling",
      'student_section_or_course': "Grade 10 - Newton / computer science",
      "student_year_level": "grade 10 / 1st year college",
      "student_school_year": "2026-2027"
    }
  ]
}

```
- [ ] create a function to import the masterlist data to the system
- [ ] create a function to generate a unique qr code for each student based on the masterlist data and save it to the system
and when importing the masterlist data, the qr code should be generated automatically, and thier credential should be created automatically, and thier account should be created automatically and log in should be using their student_id or student_lrn_or_student_id_number as the username and the default password should be the same as their student_id or student_lrn_or_student_id_number , make the password can be changed by the student later on 
