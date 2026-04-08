package com.gestion.collaborateurs.dto;

import com.gestion.collaborateurs.entity.CV;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvDTO {
    private Long id;
    private LocalDateTime dateGeneration;
    private int version;
    private String format;
    private String nomFichier;

    public static CvDTO fromEntity(CV cv) {
        return CvDTO.builder()
                .id(cv.getId())
                .dateGeneration(cv.getDateGeneration())
                .version(cv.getVersion())
                .format(cv.getFormat())
                .nomFichier(cv.getNomFichier())
                .build();
    }
}
