          {activeTab === 'novedades' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              id="novedades-tab-grid"
            >
              
              {/* Form Side - Register new leave */}
              <div className="space-y-6 lg:col-span-1" id="novedad-form-wrapper">
                


                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="form-card">
                  <div className="flex items-center gap-2 mb-4">
                    <FilePlus className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-base">Registrar Nuevo Permiso / Novedad</h3>
                  </div>

                  <form onSubmit={handleAddNovedadSubmit} className="space-y-4" id="form-register-novedad">
                    
                    {/* Select Employee (Searchable Autocomplete Combobox) */}
                    <div className="space-y-1.5" id="form-field-employee">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Docente / Funcionario de Alvernia <span className="text-red-500">*</span>
                      </label>
                      
                      {selectedEmpIdForNovedad && employeesDict[selectedEmpIdForNovedad] ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-150 rounded-xl shadow-xs" id="selected-employee-card">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                              {employeesDict[selectedEmpIdForNovedad].nombre.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 text-xs truncate uppercase leading-tight">
                                {employeesDict[selectedEmpIdForNovedad].nombre}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                C.C. {employeesDict[selectedEmpIdForNovedad].cedula} • {employeesDict[selectedEmpIdForNovedad].cargo}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleEmployeeSelectionForNovedad('');
                              setEmployeeSelectSearch('');
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0 focus:outline-none"
                            title="Cambiar funcionario"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div id="search-employee-combobox-container" className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Buscar por Nombre, Apellidos o Cédula..."
                              value={employeeSelectSearch}
                              onFocus={() => setIsEmployeeSelectOpen(true)}
                              onChange={(e) => {
                                setEmployeeSelectSearch(e.target.value);
                                setIsEmployeeSelectOpen(true);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal"
                              id="combobox-search-input"
                            />
                            {employeeSelectSearch && (
                              <button
                                type="button"
                                onClick={() => setEmployeeSelectSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 focus:outline-none p-0.5 hover:bg-slate-200/50 rounded-full"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Options dropdown */}
                          <AnimatePresence>
                            {isEmployeeSelectOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-150 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50"
                                id="combobox-options-dropdown"
                              >
                                <div className="max-h-60 overflow-y-auto" id="combobox-scroll-area">
                                  {filteredSelectEmployees.length === 0 ? (
                                    <div className="p-4 text-center text-slate-450 text-xs">
                                      No se encontraron funcionarios coincidentes
                                    </div>
                                  ) : (
                                    filteredSelectEmployees.map(emp => {
                                      const isActivo = emp.activo;
                                      return (
                                        <button
                                          key={emp.cedula}
                                          type="button"
                                          disabled={!isActivo}
                                          onClick={() => {
                                            handleEmployeeSelectionForNovedad(emp.cedula);
                                            setIsEmployeeSelectOpen(false);
                                          }}
                                          className={`w-full text-left p-2.5 flex items-center gap-2.5 transition-colors focus:outline-none ${
                                            isActivo 
                                              ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer' 
                                              : 'bg-slate-50/50 opacity-40 cursor-not-allowed'
                                          }`}
                                        >
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                            isActivo ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                                          }`}>
                                            {emp.nombre.charAt(0)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 text-xs truncate uppercase leading-tight">
                                              {emp.nombre}
                                            </p>
                                            <p className="text-[10px] text-slate-450 font-medium truncate mt-0.5">
                                              C.C. {emp.cedula} • {emp.cargo} {!isActivo && ' (INHABILITADO)'}
                                            </p>
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Auto fields displaying position info of selected employee */}
                    {selectedEmpIdForNovedad && employeesDict[selectedEmpIdForNovedad] && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-600" id="form-novedad-emp-metadata">
                        <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> <strong>Cargo:</strong> <span className="truncate">{employeesDict[selectedEmpIdForNovedad].cargo}</span></div>
                        <div className="flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-slate-400" /> <strong>Sede Ordinaria:</strong> <span>{getSedeFormatted(employeesDict[selectedEmpIdForNovedad].sedeTrabajo)}</span></div>
                        <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-slate-400" /> <strong>Área de Desempeño:</strong> <span>{employeesDict[selectedEmpIdForNovedad].areaDesempeno}</span></div>
                      </div>
                    )}

                    {/* Sede where novelty happened */}
                    <div className="space-y-1.5" id="form-field-sede-novedad">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Sede donde se presenta la Novedad <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newNovSede}
                        onChange={(e) => setNewNovSede(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        id="form-novedad-sede"
                      >
                        {SEDES_OPCIONES.map(s => (
                          <option key={s} value={s}>{getSedeFormatted(s)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Type of Leave */}
                    <div className="space-y-1.5" id="form-field-clase-novedad">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Clase de Novedad (Selección Obligatoria) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newNovClase}
                        onChange={(e) => setNewNovClase(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 max-h-32"
                        id="form-novedad-clase"
                      >
                        {CLASES_NOVEDADES_OPCIONES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date and hour range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="form-field-time-range">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Inicio del Permiso <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newNovFechaInicio}
                          onChange={(e) => setNewNovFechaInicio(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-fecha-inicio"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Finalización del Permiso <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newNovFechaFin}
                          onChange={(e) => setNewNovFechaFin(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-fecha-fin"
                        />
                      </div>
                    </div>

                    {/* Obligatory novelty parameters */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3" id="form-field-flags">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block truncate" title="¿Está laborando normalmente?">
                          ¿Laborando normalmente?
                        </label>
                        <select
                           value={newNovLaborando}
                           onChange={(e) => setNewNovLaborando(e.target.value as 'Si' | 'No')}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                           id="form-novedad-laborando"
                        >
                          <option value="No">No</option>
                          <option value="Si">Si (Sí)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block truncate" title="¿Se le asignó carga académica?">
                          ¿Asignó carga académica?
                        </label>
                        <select
                          value={newNovCarga}
                          onChange={(e) => setNewNovCarga(e.target.value as 'Si' | 'No')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-carga-academica"
                        >
                          <option value="Si">Sí (Si)</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Support document data */}
                    <div className="border-t border-slate-100 pt-3 space-y-3" id="form-field-support">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Documento que lo Soporta
                        </label>
                        <select
                          value={newNovDocTipo}
                          onChange={(e) => setNewNovDocTipo(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                          id="form-novedad-doc-tipo"
                        >
                          <option value="">-- Sin soporte doc especificado --</option>
                          {DOCUMENTOS_SOPORTE_OPCIONES.map(opt => (
                            <option key={opt.clave} value={opt.clave}>{opt.descripcion}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-500 block">
                            Núm de Radicado / Soporte
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: R-045 o INC-8821"
                            value={newNovDocNo}
                            onChange={(e) => setNewNovDocNo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            id="form-novedad-doc-no"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-500 block">
                            Fecha de Expedición
                          </label>
                          <input
                            type="date"
                            value={newNovDocFecha}
                            onChange={(e) => setNewNovDocFecha(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            id="form-novedad-doc-fecha"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observaciones extra comments */}
                    <div className="space-y-1.5" id="form-field-comments">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Observaciones y Detalles del Permiso
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Escriba aquí destalles del permiso o reemplazos del docente..."
                        value={newNovObservaciones}
                        onChange={(e) => setNewNovObservaciones(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                        id="form-novedad-observaciones"
                      />
                    </div>

                    {newNovError && (
                      <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs flex items-start gap-2" id="new-novedad-error-banner">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{newNovError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      id="form-submit-novedad"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Novedad en Agenda
                    </button>

                  </form>
                </div>
              </div>

              {/* View/Listing Table Side - History & Search */}
              <div className="space-y-6 lg:col-span-2" id="novedades-history-ledger-wrapper">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="ledger-card">
                  
                  {/* Ledger Header & Search Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-800 text-base" id="history-box-title">Historial de Novedades y Permisos</h3>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                        {filteredNovedadesList.length} registros filtrados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="ledger-search-row">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar por Docente, CC, Radicado..."
                          value={novedadSearch}
                          onChange={(e) => setNovedadSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                          id="search-novedad-input"
                        />
                      </div>

                      <div>
                        <select
                          value={novedadSedeFilter}
                          onChange={(e) => setNovedadSedeFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px]"
                          id="filter-novedad-sede"
                        >
                          <option value="TODAS">TODAS LAS SEDES</option>
                          {SEDES_OPCIONES.map(s => (
                            <option key={s} value={s}>{getSedeFormatted(s)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={novedadClaseFilter}
                          onChange={(e) => setNovedadClaseFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px] truncate"
                          id="filter-novedad-clase"
                        >
                          <option value="TODAS">TODAS LAS NOVEDADES</option>
                          {CLASES_NOVEDADES_OPCIONES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  {filteredNovedadesList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl" id="ledger-empty-state">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm text-slate-600">No se encontraron registros de novedades</p>
                      <p className="text-xs text-slate-400">Modifica los filtros o registra un nuevo permiso en el formulario.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl" id="ledger-table-container">
                      <table className="w-full text-left border-collapse text-xs" id="table-ledger">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                            <th className="p-3">Docente / Servidor</th>
                            <th className="p-3">Sede</th>
                            <th className="p-3">Novedad</th>
                            <th className="p-3">Inicio / Fin del Permiso</th>
                            <th className="p-3">Soporte</th>
                            <th className="p-3 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredNovedadesList.map((nov) => {
                            const emp = employeesDict[nov.empleadoId];
                            const docSopOption = nov.documentoSoporteTipo ? DOCUMENTOS_SOPORTE_OPCIONES.find(o => o.clave === nov.documentoSoporteTipo) : null;
                            const isCurrentActive = new Date().getTime() >= new Date(nov.fechaInicio).getTime() && new Date().getTime() <= new Date(nov.fechaFin).getTime();

                            return (
                              <tr key={nov.id} className={`hover:bg-slate-50/50 ${isCurrentActive ? 'bg-amber-50/35 border-l-4 border-l-amber-500' : ''}`}>
                                <td className="p-3">
                                  {emp ? (
                                    <div>
                                      <p className="font-bold text-slate-900 group-hover:underline">{emp.nombre}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">CC {emp.cedula} • {emp.cargo.substring(0, 30)}...</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-bold text-rose-700">Funcionario Borrado</p>
                                      <p className="text-[10px] text-slate-400 font-mono">ID {nov.empleadoId}</p>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold">{getSedeFormatted(nov.sedeNovedad)}</span>
                                </td>
                                <td className="p-3">
                                  <p className="font-medium text-amber-900 leading-tight">{nov.claseNovedad}</p>
                                  {nov.observaciones && <p className="text-[10px] text-slate-400 max-w-[180px] truncate" title={nov.observaciones}>Obs: {nov.observaciones}</p>}
                                </td>
                                <td className="p-3">
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] flex items-center gap-1 text-slate-650">
                                      <span className="font-bold text-blue-750">Desde:</span> {nov.fechaInicio.replace('T', ' ')}
                                    </div>
                                    <div className="text-[10px] flex items-center gap-1 text-slate-650">
                                      <span className="font-bold text-rose-700">Hasta:</span> {nov.fechaFin.replace('T', ' ')}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  {nov.documentoSoporteTipo ? (
                                    <div>
                                      <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        {nov.documentoSoporteTipo}
                                      </span>
                                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{nov.documentoSoporteNo}</p>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">Sin adjunto</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteNovedad(nov.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar permiso"
                                    id={`btn-del-nov-${nov.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== TAB 2: GESTION DE EMPLEADOS (PERSONAL) ==================== */}
          {activeTab === 'empleados' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
              id="empleados-tab-view"
            >
              
              {/* Excel Importer Box Area */}
              <ExcelImporter onImportCompleted={handleImportCompleted} />

              {/* Advanced search and listings segment */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="directory-card">
                
                {/* Search control bars */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6" id="directory-search-header">
                  
                  <div>
                    <h3 className="font-bold text-slate-800 text-base" id="directory-label">Directorios de Empleados Institucionales</h3>
                    <p className="text-xs text-slate-400">Total de {filteredEmployeesList.length} funcionarios visibles en los criterios de búsqueda.</p>
                  </div>

                  <div className="flex flex-wrap gap-2" id="directory-control-blocks">
                    
                    {/* Add manual employee trigger */}
                    <button
                      onClick={() => setShowAddEmployeeModal(true)}
                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 transition-colors font-bold text-xs shadow-sm cursor-pointer"
                      id="btn-trigger-add-manual-employee animate-pulse"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Funcionario Manual
                    </button>

                    {/* Clear app data action trigger */}
                    <button
                      onClick={() => setConfirmResetOpen(true)}
                      className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-xs border border-red-200 shadow-sm cursor-pointer"
                      id="btn-trigger-reset-app-data"
                      title="Eliminar todos los datos para cargar registros reales"
                    >
                      <Trash2 className="w-4 h-4 text-red-650" />
                      Limpiar Base de Datos
                    </button>

                  </div>

                </div>

                {/* Sub row search boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6" id="directory-secondary-filter-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por Nombre y Apellido o Cédula..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                      id="search-emp-input"
                    />
                  </div>

                  <div>
                    <select
                      value={employeeSedeFilter}
                      onChange={(e) => setEmployeeSedeFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px]"
                      id="filter-emp-sede"
                    >
                      <option value="TODAS">TODAS LAS SEDES DE TRABAJO</option>
                      {SEDES_OPCIONES.map(s => (
                        <option key={s} value={s}>{getSedeFormatted(s)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={employeeStatusFilter}
                      onChange={(e) => setEmployeeStatusFilter(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-[34px]"
                      id="filter-emp-status"
                    >
                      <option value="TODOS">TODOS LOS ESTADOS DE ASISTENCIA</option>
                      <option value="ACTIVOS">FUNCIONARIOS ACTIVOS (LA&zwnj;BORANDO)</option>
                      <option value="INACTIVOS">FUNCIONARIOS INHABILITADOS (RETIRADOS)</option>
                    </select>
                  </div>
                </div>

                {/* Manual employee insertion modal/form widget */}
                <AnimatePresence>
                  {showAddEmployeeModal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50 border border-slate-150 rounded-xl p-5 mb-6 space-y-4 shadow-inner overflow-hidden"
                      id="modal-add-employee"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Formulario de Registro Manual de Nuevo Empleado</h4>
                        <button 
                          onClick={() => setShowAddEmployeeModal(false)}
                          className="text-xs bg-slate-200 hover:bg-slate-350 px-2 py-1 rounded text-slate-650 cursor-pointer font-bold"
                        >
                          Cerrar Formulario
                        </button>
                      </div>

                      <form onSubmit={handleAddEmployeeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4" id="form-add-emp">
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Nombres y Apellidos Completos *</label>
                          <input
                            type="text"
                            placeholder="Ej: ALBA GÓMEZ ROJAS"
                            value={newEmpNombre}
                            onChange={(e) => setNewEmpNombre(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-nombre"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Cédula del Funcionario (Único) *</label>
                          <input
                            type="text"
                            placeholder="Ej: 1085223405"
                            value={newEmpCedula}
                            onChange={(e) => setNewEmpCedula(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-cedula"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Cargo Administrativo / Docente *</label>
                          <select
                            value={newEmpCargo}
                            onChange={(e) => setNewEmpCargo(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-cargo"
                          >
                            {CARGOS_OPCIONES.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Sede de Trabajo Ordinario *</label>
                          <select
                            value={newEmpSede}
                            onChange={(e) => setNewEmpSede(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            id="field-emp-sede"
                          >
                            {SEDES_OPCIONES.map(s => (
                              <option key={s} value={s}>{getSedeFormatted(s)}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 block text-ellipsis overflow-hidden">H/A (Horas Aula)</label>
                            <input
                              type="number"
                              value={newEmpHorasAula}
                              onChange={(e) => setNewEmpHorasAula(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                              id="field-emp-ha"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 block text-ellipsis overflow-hidden">H/L (Horas Libres)</label>
                            <input
                              type="number"
                              value={newEmpHorasLibres}
                              onChange={(e) => setNewEmpHorasLibres(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                              id="field-emp-hl"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Área de Desempeño Escolar *</label>
                          <select
                            value={newEmpArea}
                            onChange={(e) => setNewEmpArea(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                            id="field-emp-area"
                          >
                            {AREAS_DESEMPENO_OPCIONES.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">Tipo Nombramiento *</label>
                          <select
                            value={newEmpNombramiento}
                            onChange={(e) => setNewEmpNombramiento(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                            id="field-emp-nombramiento"
                          >
                            {TIPOS_NOMBRAMIENTO_OPCIONES.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block">¿Es Zona de Difícil Acceso? *</label>
                          <select
                            value={newEmpDificil}
                            onChange={(e) => setNewEmpDificil(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none"
                            id="field-emp-dificil"
                          >
                            <option value="No">No</option>
                            <option value="Si">Sí (Zona de Difícil Acceso)</option>
                          </select>
                        </div>

                        <div className="flex items-end justify-end h-full" id="field-emp-btn-row">
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow shadow-blue-700 font-bold flex items-center justify-center gap-1 cursor-pointer"
                            id="btn-apply-add-emp"
                          >
                            <Plus className="w-3.5 h-3.5" /> Guardar Nuevo Funcionario
                          </button>
                        </div>

                        {newEmpError && (
                          <div className="col-span-1 md:col-span-3 p-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs" id="add-emp-error-alert">
                            {newEmpError}
                          </div>
                        )}

                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Directory data list */}
                {filteredEmployeesList.length === 0 ? (
                  <div className="py-12 border border-dashed border-slate-150 text-slate-400 text-center rounded-xl" id="directory-empty-state">
                    <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No se encontraron funcionarios</p>
                    <p className="text-xs text-slate-400">Intenta buscando con palabras clave o haz clic en "Registrar Funcionario Manual" para agregar uno nuevo.</p>
                  </div>
                ) : (
                  <div className="space-y-2" id="directory-employees-grid">
                    {filteredEmployeesList.map((emp) => {
                      const totalNovedadesCount = novedades.filter(n => n.empleadoId === emp.cedula).length;

                      return (
                        <div 
                          key={emp.cedula} 
                          className={`px-4 py-3 rounded-xl border transition-all flex flex-col lg:grid lg:grid-cols-12 lg:gap-4 items-stretch lg:items-center ${
                            emp.activo 
                              ? 'bg-white border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-xs' 
                              : 'bg-slate-50 border-slate-100 opacity-80'
                          }`}
                          id={`employee-card-${emp.cedula}`}
                        >
                          {/* Col 1: Identification & Status */}
                          <div className="lg:col-span-3 flex flex-col gap-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${
                                emp.activo 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/70' 
                                  : 'bg-slate-150 text-slate-600 border border-slate-250/70'
                              }`}>
                                {emp.activo ? 'Laborando normalmente' : 'Inhabilitado / Retirado'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-850 text-sm tracking-tight mt-0.5 truncate" title={emp.nombre}>{emp.nombre}</h4>
                            <span className="font-mono text-[10px] text-slate-400">CC. {emp.cedula}</span>
                          </div>

                          {/* Col 2: Cargo & Sede */}
                          <div className="lg:col-span-3 flex flex-col gap-0.5 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100/60 pr-2">
                            <div className="truncate">
                              <span className="text-[10px] text-slate-400 font-mono inline-block w-12">Cargo:</span>
                              <span className="text-xs font-semibold text-slate-700 inline-block truncate max-w-[190px]" title={emp.cargo}>{emp.cargo}</span>
                            </div>
                            <div className="truncate">
                              <span className="text-[10px] text-slate-400 font-mono inline-block w-12">Sede:</span>
                              <span className="text-xs font-bold text-slate-800" title={getSedeFormatted(emp.sedeTrabajo)}>
                                {getSedeFormatted(emp.sedeTrabajo)}
                              </span>
                            </div>
                          </div>

                          {/* Col 3: Área, Nombramiento & Hours */}
                          <div className="lg:col-span-3 flex flex-col gap-1 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100/60 pr-2">
                            <div className="flex items-center gap-x-3 text-xs">
                              <div className="truncate flex-1">
                                <span className="text-[10px] text-slate-400 font-mono">Área: </span>
                                <span className="text-zinc-650 font-medium truncate inline-block max-w-[100px]" title={emp.areaDesempeno}>{emp.areaDesempeno}</span>
                              </div>
                              <div className="truncate shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono">Nomb.: </span>
                                <span className="text-cyan-800 font-bold">{emp.tipoNombramiento}</span>
                              </div>
                            </div>
                            <div className="text-[10px] flex items-center flex-wrap gap-1.5 text-slate-500">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">Aula: {emp.horasAula}h</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">Libres: {emp.horasLibres}h</span>
                              {emp.dificilAcceso === 'Si' && (
                                <span className="bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded border border-orange-100 leading-none text-[9px]">
                                  Difícil Acceso
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Col 4: Novedades and Controls */}
                          <div className="lg:col-span-3 flex flex-row lg:flex-cols items-center lg:justify-between justify-between gap-2 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100/60">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 shrink-0">
                              <Activity className="w-3.5 h-3.5 text-blue-600" />
                              Novedades: <span className="text-slate-800 font-black">{totalNovedadesCount}</span>
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Inactivate Toggle Trigger Button */}
                              <button
                                onClick={() => handleToggleEmployeeActive(emp.cedula)}
                                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border shrink-0 ${
                                  emp.activo
                                    ? 'bg-rose-50 border-rose-100 hover:bg-rose-100/70 text-rose-700'
                                    : 'bg-blue-50 border-blue-100 hover:bg-blue-100/70 text-blue-700'
                                }`}
                                id={`toggle-active-btn-${emp.cedula}`}
                              >
                                {emp.activo ? 'Inhabilitar' : 'Habilitar'}
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteEmployee(emp.cedula)}
                                className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-150 rounded-lg"
                                title="Borrar docente"
                                id={`btn-del-emp-${emp.cedula}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* ==================== TAB 3: CÓMPUTO DE DÍAS POR DOCENTE ==================== */}
          {activeTab === 'computo' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="computo-tab-view"
            >
              <ComputoPanel 
                employees={employees} 
                novedades={novedades} 
              />
            </motion.div>
          )}

          {/* ==================== TAB 4: REPORTES Y EXPORTACIÓN ==================== */}
