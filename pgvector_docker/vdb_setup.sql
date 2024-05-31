CREATE EXTENSION if not exists vector;


CREATE TABLE if not exists text_embedding_3_large
(
    db_id                SERIAL primary key,
    schema               TEXT,
    uuid                 TEXT,
    id                   INT,
    hierarchyLevel       TEXT,
    title                TEXT,
    datasetcreationdate  TEXT,
    abstract             TEXT,
    keyword              TEXT,
    geoBox               TEXT,        -- Assuming geoBox is a text representation of geographical coordinates
    constraints          TEXT,
    SecurityConstraints  TEXT,
    LegalConstraints     TEXT,
    temporalExtent       TEXT,
    image                TEXT,
    responsibleParty     TEXT,
    link                 TEXT,
    metadatacreationdate TEXT,
    productInformation   TEXT,
    parentId             TEXT,        -- Assuming parentId is a UUID referencing another entity
    title_vector         vector(3072) -- pgvector column with 3072 dimensions
);



CREATE TABLE IF NOT EXISTS text_embedding_3_large_all
(
    db_id                                    SERIAL primary key,
    uuid                                     TEXT,
    title                                    TEXT,
    abstract                                 TEXT,
    type                                     TEXT,
    type_translated                          TEXT,
    theme                                    TEXT,
    organization                             TEXT,
    organization_logo                        TEXT,
    thumbnail_url                            TEXT,
    distribution_url                         TEXT,
    distribution_protocol                    TEXT,
    show_details_url                         TEXT,
    organization_url                         TEXT,
    is_open_data                             BOOLEAN,
    access_is_opendata                       BOOLEAN,
    access_is_restricted                     BOOLEAN,
    access_is_protected                      BOOLEAN,
    is_dok_data                              BOOLEAN,
    legend_description_url                   TEXT,
    product_sheet_url                        TEXT,
    product_specification_url                TEXT,
    dataset_services                         TEXT,
    distributions                            TEXT,
    dataset_services_with_show_map_link      TEXT,
    access_constraint                        TEXT,
    other_constraints_access                 TEXT,
    data_access                              TEXT,
    service_distribution_url_for_dataset     TEXT,
    service_uuid                             TEXT,
    service_wfs_distribution_url_for_dataset TEXT,
    get_capabilities_url                     TEXT,
    date                                     TEXT,
    show_map_link                            BOOLEAN,
    spatial_scope                            TEXT,
    title_vector                             vector(3072)
);
