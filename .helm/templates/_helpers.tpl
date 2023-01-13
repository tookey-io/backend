// Truncate is required for correct ACME certificate
{{- define "stanks-frontend.branch" }}
{{- .Values.branch | replace "/" "-" | replace "0" "a" | replace "1" "b" | replace "2" "c" | replace "3" "d" | replace "4" "e" | replace "5" "f" | replace "6" "g" | replace "7" "h" | replace "8" "i" | replace "9" "j" | replace " " "-" | replace "_" "-" | kebabcase | trunc 24 | trimSuffix "-" }}
{{- end }}

{{- define "stanks-frontend.domain-tr" }}
{{- .Values.branch | replace "/" "-" | replace "_" "-" | kebabcase | trunc 24 | trimSuffix "-" }}
{{- end }}
