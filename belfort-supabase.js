(function (root) {
  const SUPABASE_URL = 'https://rjxnxfbblhfxxyfaawev.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_MRO0L1EaLAKrJa4BELfXwg_-1EXImj4';

  function requireClient() {
    if (!root.supabase || !root.supabase.createClient) {
      throw new Error('Cliente Supabase não foi carregado.');
    }
    return root.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }

  const client = requireClient();

  function getProfileOrg(profile) {
    if (!profile || !profile.organization_id) throw new Error('Perfil sem organização vinculada.');
    return profile.organization_id;
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProfile() {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return null;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    if (error) throw error;
    return data;
  }

  async function signUpWithSecurityCode({ fullName, email, recoveryPassword, securityCode }) {
    const recoveryHash = await root.BelfortAuthUtils.sha256Hex(recoveryPassword);
    const securityHash = await root.BelfortAuthUtils.sha256Hex(securityCode);
    const { data, error } = await client.auth.signUp({
      email,
      password: securityCode,
      options: { data: { full_name: fullName, recovery_password_hash: recoveryHash, security_code_hash: securityHash } }
    });
    if (error) throw error;

    if (data.session) {
      await saveSecurityCodeForCurrentUser(securityCode);
    }

    return data;
  }

  async function saveSecurityCodeForCurrentUser(securityCode) {
    const codeHash = await root.BelfortAuthUtils.sha256Hex(securityCode);
    const { error } = await client.rpc('set_security_code_hash', { input_hash: codeHash });
    if (error) throw error;
  }

  function parseMoney(value) {
    return root.BelfortAuthUtils.parseCurrencyValue(value);
  }

  function parseStock(value) {
    return root.BelfortAuthUtils.parseInteger(value);
  }

  function normalizeDate(value) {
    return root.BelfortAuthUtils.normalizeDate(value);
  }

  function toParcelRows(organizationId, parentColumn, parentId, parcelas) {
    return (parcelas || []).map((parcela, index) => ({
      organization_id: organizationId,
      [parentColumn]: parentId,
      numero: index + 1,
      vencimento: normalizeDate(parcela.data),
      valor: parseMoney(parcela.valor),
      status: parcela.status || 'pendente'
    }));
  }

  async function signInWithSecurityCode({ email, securityCode }) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: securityCode });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function loadDashboardData(profile) {
    const organizationId = getProfileOrg(profile);
    const [clientesRes, obrasRes, epiRes, equipRes, profissionaisRes, cndRes, notificationsRes] = await Promise.all([
      client.from('clientes').select('*, cliente_art_pagamentos(*, cliente_art_parcelas(*))').eq('organization_id', organizationId).order('created_at'),
      client.from('obras').select('*, obra_pagamentos(*, obra_pagamento_parcelas(*)), obra_documentos(*)').eq('organization_id', organizationId).order('created_at'),
      client.from('epi_items').select('*, epi_estoque(*)').eq('organization_id', organizationId).eq('active', true).order('created_at'),
      client.from('equipamentos').select('*, equipamento_estoque(*)').eq('organization_id', organizationId).eq('active', true).order('created_at'),
      client.from('profissionais').select('*, profissional_treinamentos(*)').eq('organization_id', organizationId).order('created_at'),
      client.from('cnd_mensal').select('*').eq('organization_id', organizationId).order('ano').order('mes'),
      client.from('notifications').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50)
    ]);

    for (const res of [clientesRes, obrasRes, epiRes, equipRes, profissionaisRes, cndRes, notificationsRes]) {
      if (res.error) throw res.error;
    }

    return {
      clientes: clientesRes.data,
      obras: obrasRes.data,
      epis: epiRes.data,
      equipamentos: equipRes.data,
      profissionais: profissionaisRes.data,
      cnd: cndRes.data,
      notifications: notificationsRes.data
    };
  }

  async function insertCliente(profile, cliente) {
    const organizationId = getProfileOrg(profile);
    const doc = root.BelfortAuthUtils.splitClienteDocumento(cliente.documento);
    const endereco = typeof cliente.endereco === 'object' ? cliente.endereco : {};
    const { data, error } = await client.from('clientes').insert({
      organization_id: organizationId,
      created_by: profile.id,
      nome: cliente.nome,
      documento_tipo: doc.tipo,
      documento_numero: doc.numero,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco_cep: endereco.cep || null,
      endereco_logradouro: endereco.logradouro || null,
      endereco_numero: endereco.numero || null,
      endereco_complemento: endereco.complemento || null,
      endereco_bairro: endereco.bairro || null,
      endereco_cidade: endereco.cidade || null,
      endereco_uf: endereco.uf || null
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function insertObra(profile, obra, clienteId) {
    const organizationId = getProfileOrg(profile);
    const endereco = obra.endereco || {};
    const { data, error } = await client.from('obras').insert({
      organization_id: organizationId,
      cliente_id: clienteId,
      created_by: profile.id,
      descricao: obra.descricao,
      data_inicio: obra.dataInicio,
      data_termino: obra.dataTermino,
      valor: root.BelfortAuthUtils.parseCurrencyValue(obra.valor),
      endereco_cep: endereco.cep || null,
      endereco_logradouro: endereco.logradouro || null,
      endereco_numero: endereco.numero || null,
      endereco_complemento: endereco.complemento || null,
      endereco_bairro: endereco.bairro || null,
      endereco_cidade: endereco.cidade || null,
      endereco_uf: endereco.uf || null
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function insertNotification(profile, notification) {
    const organizationId = getProfileOrg(profile);
    const { data, error } = await client.from('notifications').insert({
      organization_id: organizationId,
      user_id: profile.id,
      tag: notification.tag,
      description: notification.description,
      target_page: notification.targetPage,
      target_selector: notification.targetSelector,
      unread: notification.unread !== false
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function markNotificationRead(profile, notificationId) {
    getProfileOrg(profile);
    if (!notificationId) return null;
    const { data, error } = await client
      .from('notifications')
      .update({ unread: false })
      .eq('id', notificationId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async function insertDocumentoAnexos(profile, files) {
    const organizationId = getProfileOrg(profile);
    const rows = (files || []).map(file => ({
      organization_id: organizationId,
      file_name: file.name,
      file_size: file.size || null,
      mime_type: file.type || null,
      storage_path: null,
      created_by: profile.id
    }));
    if (!rows.length) return [];
    const { data, error } = await client.from('documento_anexos').insert(rows).select('*');
    if (error) throw error;
    return data;
  }

  async function upsertObraDocumentos(profile, obraId, documentos) {
    const organizationId = getProfileOrg(profile);
    if (!obraId) throw new Error('Selecione uma obra sincronizada com o banco.');
    const { error: deleteError } = await client.from('obra_documentos').delete().eq('obra_id', obraId);
    if (deleteError) throw deleteError;
    const rows = (documentos || []).map(doc => ({
      organization_id: organizationId,
      obra_id: obraId,
      nome: doc.nome,
      status: doc.checked ? 'entregue' : 'pendente',
      checked: !!doc.checked
    }));
    if (!rows.length) return [];
    const { data, error } = await client.from('obra_documentos').insert(rows).select('*');
    if (error) throw error;
    return data;
  }

  async function upsertObraPagamento(profile, obra, pagamento) {
    const organizationId = getProfileOrg(profile);
    const { data, error } = await client.from('obra_pagamentos').upsert({
      organization_id: organizationId,
      obra_id: obra.id,
      tipo: pagamento.tipo,
      valor_pago: parseMoney(pagamento.valorPago),
      data_pagamento: normalizeDate(pagamento.dataPagamento),
      entrada: parseMoney(pagamento.entrada),
      valor_parcela: parseMoney(pagamento.valorParcela),
      quantidade_parcelas: pagamento.quantidadeParcelas || null
    }, { onConflict: 'obra_id' }).select('*').single();
    if (error) throw error;
    const { error: parcelasDeleteError } = await client.from('obra_pagamento_parcelas').delete().eq('pagamento_id', data.id);
    if (parcelasDeleteError) throw parcelasDeleteError;
    const parcelas = toParcelRows(organizationId, 'pagamento_id', data.id, pagamento.parcelas);
    if (parcelas.length) {
      const { error: parcelasError } = await client.from('obra_pagamento_parcelas').insert(parcelas);
      if (parcelasError) throw parcelasError;
    }
    return data;
  }

  async function upsertClienteArt(profile, cliente, art) {
    const organizationId = getProfileOrg(profile);
    const pagamento = art.pagamento || {};
    const { data, error } = await client.from('cliente_art_pagamentos').upsert({
      organization_id: organizationId,
      cliente_id: cliente.id,
      valor_acordado: parseMoney(art.valorAcordado),
      tipo: pagamento.tipo,
      valor_pago: parseMoney(pagamento.valorPago),
      data_pagamento: normalizeDate(pagamento.dataPagamento),
      entrada: parseMoney(pagamento.entrada),
      valor_parcela: parseMoney(pagamento.valorParcela),
      quantidade_parcelas: pagamento.quantidadeParcelas || null
    }, { onConflict: 'cliente_id' }).select('*').single();
    if (error) throw error;
    const { error: parcelasDeleteError } = await client.from('cliente_art_parcelas').delete().eq('art_pagamento_id', data.id);
    if (parcelasDeleteError) throw parcelasDeleteError;
    const parcelas = toParcelRows(organizationId, 'art_pagamento_id', data.id, pagamento.parcelas);
    if (parcelas.length) {
      const { error: parcelasError } = await client.from('cliente_art_parcelas').insert(parcelas);
      if (parcelasError) throw parcelasError;
    }
    return data;
  }

  async function insertProfissional(profile, profissional) {
    const organizationId = getProfileOrg(profile);
    const { data, error } = await client.from('profissionais').insert({
      organization_id: organizationId,
      created_by: profile.id,
      nome: profissional.nome,
      profissao: profissional.profissao,
      documento: profissional.documento || null,
      telefone: profissional.telefone || null,
      email: profissional.email || null,
      endereco: profissional.endereco || null,
      observacoes: profissional.observacoes || null
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function insertTreinamento(profile, profissional, treinamento) {
    const organizationId = getProfileOrg(profile);
    if (!profissional.id) {
      const saved = await insertProfissional(profile, profissional);
      profissional.id = saved.id;
    }
    const { data, error } = await client.from('profissional_treinamentos').insert({
      organization_id: organizationId,
      profissional_id: profissional.id,
      nome: treinamento.nome,
      tipo: treinamento.tipo,
      data_treinamento: normalizeDate(treinamento.data),
      observacoes: treinamento.observacoes || null
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function upsertStockItem(profile, item, config) {
    const organizationId = getProfileOrg(profile);
    const itemId = item.id || crypto.randomUUID();
    const { data, error } = await client.from(config.itemTable).upsert({
      id: itemId,
      organization_id: organizationId,
      nome: item.nome,
      active: item.active !== false
    }).select('*').single();
    if (error) throw error;
    const { error: estoqueError } = await client.from(config.stockTable).upsert({
      organization_id: organizationId,
      [config.foreignKey]: data.id,
      total: parseStock(item.total),
      em_uso: parseStock(item.emUso)
    }, { onConflict: config.foreignKey });
    if (estoqueError) throw estoqueError;
    return data;
  }

  async function saveEpiItem(profile, item) {
    return upsertStockItem(profile, item, { itemTable: 'epi_items', stockTable: 'epi_estoque', foreignKey: 'epi_item_id' });
  }

  async function saveEquipamento(profile, item) {
    return upsertStockItem(profile, item, { itemTable: 'equipamentos', stockTable: 'equipamento_estoque', foreignKey: 'equipamento_id' });
  }

  async function removeEpiItem(profile, item) {
    getProfileOrg(profile);
    if (!item.id) return null;
    const { error } = await client.from('epi_items').update({ active: false }).eq('id', item.id);
    if (error) throw error;
    return true;
  }

  async function removeEquipamento(profile, item) {
    getProfileOrg(profile);
    if (!item.id) return null;
    const { error } = await client.from('equipamentos').update({ active: false }).eq('id', item.id);
    if (error) throw error;
    return true;
  }

  async function upsertCnd(profile, ano, mes, valorPago) {
    const organizationId = getProfileOrg(profile);
    const { data, error } = await client.from('cnd_mensal').upsert({
      organization_id: organizationId,
      ano,
      mes,
      valor_pago: valorPago,
      status: valorPago > 0 ? 'pago' : 'pendente'
    }, { onConflict: 'organization_id,ano,mes' }).select('*').single();
    if (error) throw error;
    return data;
  }

  root.BelfortSupabase = {
    client,
    getSession,
    getProfile,
    signUpWithSecurityCode,
    saveSecurityCodeForCurrentUser,
    signInWithSecurityCode,
    signOut,
    loadDashboardData,
    insertCliente,
    insertObra,
    insertNotification,
    insertDocumentoAnexos,
    upsertObraDocumentos,
    markNotificationRead,
    upsertObraPagamento,
    upsertClienteArt,
    insertProfissional,
    insertTreinamento,
    saveEpiItem,
    saveEquipamento,
    removeEpiItem,
    removeEquipamento,
    upsertCnd
  };
})(window);
