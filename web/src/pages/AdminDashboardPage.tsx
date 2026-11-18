import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { adminApi, catalogApi } from '../services/api';
import type { AdminDashboardStats, Commerce, Offer, Order, SafeUser } from '../types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [dashRes, usersRes, comRes, offRes, ordRes] = await Promise.all([
        adminApi.dashboard(),
        adminApi.users(),
        catalogApi.getCommerces(true),
        catalogApi.getOffers({ includeAll: true }),
        adminApi.orders(),
      ]);
      setStats(dashRes.stats);
      setUsers(usersRes.users);
      setCommerces(comRes.commerces);
      setOffers(offRes.offers);
      setOrders(ordRes.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleApproveCommerce = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminApi.setCommerceStatus(id, status);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.');
    }
  };

  const handleToggleUser = async (user: SafeUser) => {
    try {
      await adminApi.setUserActive(user.id, !user.active);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await adminApi.deleteOffer(id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Administration CampusSave
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Validez les établissements partenaires, supervisez les offres et gérez les comptes utilisateurs.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Utilisateurs inscrits</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.totalUsers}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Commerces en attente</p>
            <p className="font-mono text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.pendingCommerces}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Portions sauvées</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.portionsSaved}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Volume global</p>
            <p className="font-mono text-2xl font-bold text-teal-800 mt-1 tabular-nums">
              {stats.totalVolumeTnd.toFixed(2)} DT
            </p>
          </div>
        </section>
      )}

      {/* Commerces Validation */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Validation des commerçants et établissements
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-xs text-slate-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-6 font-medium">Établissement</th>
                <th className="py-3 px-4 font-medium">Adresse</th>
                <th className="py-3 px-4 font-medium">Statut</th>
                <th className="py-3 px-6 font-medium text-right">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {commerces.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="py-3 px-6">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.category}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.address}</td>
                  <td className="py-3 px-4 text-xs font-semibold">
                    {c.status === 'approved' && <span className="text-emerald-700">Validé</span>}
                    {c.status === 'pending' && <span className="text-amber-700">En attente</span>}
                    {c.status === 'rejected' && <span className="text-red-700">Refusé</span>}
                  </td>
                  <td className="py-3 px-6 text-right space-x-2 whitespace-nowrap">
                    {c.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleApproveCommerce(c.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer"
                      >
                        Valider
                      </button>
                    )}
                    {c.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleApproveCommerce(c.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-md cursor-pointer"
                      >
                        Refuser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Users Management */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Comptes utilisateurs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-xs text-slate-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-6 font-medium">Nom</th>
                <th className="py-3 px-4 font-medium">E-mail</th>
                <th className="py-3 px-4 font-medium">Rôle</th>
                <th className="py-3 px-4 font-medium">État</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="py-3 px-6 font-medium text-slate-900">{u.fullName}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                    {u.role === 'student' && 'Étudiant'}
                    {u.role === 'merchant' && 'Commerçant'}
                    {u.role === 'admin' && 'Administrateur'}
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold">
                    <span className={u.active ? 'text-emerald-700' : 'text-red-700'}>
                      {u.active ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleUser(u)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-stone-300 hover:bg-stone-100 rounded-md cursor-pointer"
                      >
                        {u.active ? 'Suspendre' : 'Réactiver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Offers Supervision + Global Orders */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="font-display text-lg font-bold text-slate-900">Supervision des offres</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {offers.map((off) => (
              <div key={off.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{off.title}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {off.commerceName} · {off.discountedPrice.toFixed(2)} DT · {off.availableQuantity} dispo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteOffer(off.id)}
                  aria-label={`Supprimer ${off.title}`}
                  className="p-2 text-slate-400 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="font-display text-lg font-bold text-slate-900">Dernières commandes</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {orders.map((ord) => (
              <div key={ord.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    <span className="font-mono text-xs mr-2">{ord.id}</span>
                    {ord.offerTitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ord.studentName} · {ord.commerceName}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {ord.totalAmount.toFixed(2)} DT
                  </p>
                  <p className="text-xs text-slate-500">{ord.status}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="px-6 py-8 text-sm text-slate-500 text-center">
                Aucune commande enregistrée pour le moment.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
