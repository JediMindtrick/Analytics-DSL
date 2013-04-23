Analytics-DSL
=============

A small DSL and editor to allow developers and domain experts to easily write analysis programs.  Written in javascript.

## Model

The model of this dsl is very simple.  There is a set of inputs, a set of calculations and a set of outputs.  All inputs and outputs currently must take the form of either one of a set of discrete values (i.e. an enumeration), a boolean (just a special enumeration), or a number. From these three types we can now do most analysis that would lead to either a classification, a score or a decision.  

## Editor

This dsl also comes with a basic editor which is modeled off of the concept of a spreadsheet.  Spreadsheets offer two great advantages which this project tries to capture 1) domain experts which might be writing these kinds of analysis programs are usually proficient and un-intimidated by spreadsheets and 2) the immediate update behavior of a spreadsheet allows the user to get instant feedback on the correctness of their program.  Using the editor is not required, however, so developers who are more comfortable with text manipulation are free to write programs in their text editor of choice.

## Example 

As a basic example, a securities trader might need a program that would run a given analysis and then tell them whether to buy, sell, or do nothing for a particular security, at a given price and in a given quantity.  Normally this kind of analysis would often be done with either a more specialized trading language or a more general programming language (or in a spreadsheet).  This dsl instead occupies a middle ground between general purpose languages and more specialized domain languages.  The language can, and usually should, be extended when working extensively inside a more specific domain. 

[Basic Example](http://calm-ravine-8422.herokuapp.com/)

## LICENSE

(MIT license)

Copyright (c) 2013 Brandon Wilhite <brandonjwilhite@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
