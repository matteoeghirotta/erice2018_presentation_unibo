#!/bin/bash

for n in $(seq 0 34)
do
    sed -e '/meta/a\
    <style>\
      @media print{\
      @page {\
	  size: A4 landscape;\
	  width: 100%;\
	  height: 100%;\
	  margin-top: 1cm;\
	  margin-left: 0cm;\
	  margin-right: 0cm;\
      }\
    </style>\
' slide-html-${n}.html
done
